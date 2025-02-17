import { Pool } from "pg";
import { Logger } from "pino";
import { PlaidApi, TransactionsGetResponse } from "plaid";
import moment from "moment";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import { Context, PullerException, withIntegration, pushTransactions, accessToken, notifyFailure, notifySuccess } from "../util";

import { Plaid, Pipe, Exception } from "../../magic";
import { SourceFrontend, IntegrationFrontend, TransactionFrontend } from "../../storage";
import { Source, Integration, Transaction } from "../../model";

// given a source:
//   1) pull + "lock" a source
//   2) pull the credentials for the source
//   3) send all transactions after `source.createdAt` to the rules engine

const pull = (pool: Pool) => (log: Logger): TE.TaskEither<PullerException, Source.Internal.t> => {
  return pipe(
      SourceFrontend.pull(pool)(log)()
    , TE.mapLeft((error) => {
        switch (error.name) {
          case "NotFound":
            return <PullerException>"NoWork";
          default:
            log.error(error);
            return error;
        }
      })
  );
}

const pullTransactions = (log: Logger) => (plaidClient: PlaidApi) => (id: string) => (context: Context): TE.TaskEither<PullerException, Transaction.Internal.t[]> => {
  log.info(`Scheduler.puller[${id}] - pulling transactions`)
  const accountId = context.source.tag;

  const lastMonth = moment().subtract(1, "month");
  const createdAt = moment(context.source.createdAt);

  const startAfter = moment.max(lastMonth, createdAt).toDate();

  return pipe(
      Plaid.getTransactions(plaidClient)(accessToken(context.integration), startAfter, new Date())
    , TE.mapLeft(Exception.throwInternalError)
    , TE.map(A.filter((transaction) => transaction.account_id === accountId))
    , TE.map(A.map((transaction) => {
        const authorizedAt = pipe(
            O.fromNullable(transaction.authorized_datetime)
          , Pipe.orElse(() => O.fromNullable(transaction.datetime))
          , O.fold(() => new Date(), (date) => new Date(date))
        )
        const capturedAt = O.fromNullable(transaction.datetime)

        return <Transaction.Internal.t>{
            id: transaction.transaction_id
          , sourceId: context.source.id
          , userId: context.source.userId
          , amount: -1 * transaction.amount
          , merchantName: String(transaction.merchant_name)
          , description: String(transaction.name)
          , authorizedAt: authorizedAt
          , capturedAt: capturedAt
          , metadata: {}
        };
      }))
  );
}

export const countNewTransactions = (pool: Pool) => (log: Logger) => (context: Context) => (transactions: Transaction.Internal.t[]): TE.TaskEither<PullerException, number> => {
  return pipe(
      TransactionFrontend.all(pool)(log)(context.source.userId)
    , TE.map(A.map((transaction) => transaction.id))
    , TE.map((stored) => new Set(stored))
    , TE.map((stored) => pipe(transactions, A.filter((transaction) => !stored.has(transaction.id))))
    , TE.map(A.size)
  );
}

export const run = (pool: Pool) => (log: Logger) => (plaidClient: PlaidApi) => (id: string): T.Task<boolean> => {
  return pipe(
      pull(pool)(log)
    , TE.chain((source) => {
        return pipe(
            TE.Do
          , TE.bind("context", () => withIntegration(pool)(log)(source))
          , TE.bind("transactions", ({ context }) => {
              log.info(`Scheduler.puller[${id}] - pulling for ${context.source.id}`)
              return pullTransactions(log)(plaidClient)(id)(context);
            })
          , TE.bind("count", ({ context, transactions }) => countNewTransactions(pool)(log)(context)(transactions))
          , TE.bind("_", ({ transactions }) => pushTransactions(pool)(log)(id)(transactions))
          , TE.chain(({ count }) => {
              if (count > 0) {
                return notifySuccess(pool)(log)(source.userId)(count);
              } else {
                return TE.of(true);
              }
            })
          , TE.orElse(notifyFailure(pool)(log)(source.userId))
        );
      })
    , TE.match(
          (error) => {
            log.error(`Scheduler.rollup[${id}] - failed - ${error}`);
            return true;
          }
        , () => {
            log.info(`Scheduler.rollup[${id}] - completed`);
            return true;
          }
      )
    , T.map(() => true)
  );
}
