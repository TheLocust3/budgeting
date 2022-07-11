import { Pool } from "pg";
import { PlaidApi, TransactionsGetResponse } from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import { Context, PullerException, withIntegration, pushTransactions, accessToken } from "../util";

import { Plaid, Pipe, Exception } from "../../magic";
import { SourceFrontend, IntegrationFrontend, TransactionFrontend } from "../../storage";
import { Source, Integration, Transaction } from "../../model";

// given a source:
//   1) pull + "lock" a source
//   2) pull the credentials for the source
//   3) send all transactions after `source.createdAt` to the rules engine

const pull = (pool: Pool): TE.TaskEither<PullerException, Source.Internal.t> => {
  return pipe(
      SourceFrontend.pull(pool)()
    , TE.mapLeft((error) => {
        switch (error.name) {
          case "NotFound":
            return <PullerException>"NoWork";
          default:
            console.log(error);
            return error;
        }
      })
  );
}

const pullTransactions = (plaidClient: PlaidApi) => (id: string) => (context: Context): TE.TaskEither<PullerException, Transaction.Internal.t[]> => {
  console.log(`Scheduler.puller[${id}] - pulling transactions`)
  const accountId = context.source.tag;
  const createdAt = context.source.createdAt;

  return pipe(
      Plaid.getTransactions(plaidClient)(accessToken(context.integration), createdAt, new Date())
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

export const run = (pool: Pool) => (plaidClient: PlaidApi) => (id: string): T.Task<boolean> => {
  return pipe(
      pull(pool)
    , TE.chain(withIntegration(pool))
    , TE.map((context) => {
        console.log(`Scheduler.puller[${id}] - pulling for ${context.source.id}`)
        return context;
      })
    , TE.chain(pullTransactions(plaidClient)(id))
    , TE.chain(pushTransactions(pool)(id))
    , TE.match(
          (error) => {
            switch (error) {
              case "NoWork":
                return T.of(true);
              default:
                console.log(`Scheduler.puller[${id}] - failed - ${error}`);
                return T.of(true);
            }
          }
        , () => {
            console.log(`Scheduler.puller[${id}] - completed`);
            return T.of(true);
          }
      )
    , T.map(() => true)
  );
}
