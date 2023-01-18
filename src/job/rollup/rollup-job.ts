import crypto from "crypto";
import { Logger } from "pino";
import { Pool } from "pg";
import { PlaidApi, TransactionsGetResponse, AccountBase } from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import { Context, PullerException, withIntegration, pushTransactions, accessToken } from "../util";

import { Exception, Plaid, Pipe } from "../../magic";
import { SourceFrontend, IntegrationFrontend, TransactionFrontend } from "../../storage";
import { Source, Integration, Transaction } from "../../model";

const pull = (pool: Pool) => (log: Logger): TE.TaskEither<PullerException, Source.Internal.t> => {
  return pipe(
      SourceFrontend.pullForRollup(pool)()
    , TE.mapLeft((error) => {
        switch (error.name) {
          case "NotFound":
            return <PullerException>"NoWork";
          default:
            log.error(error);
            return error
        }
      })
  );
}

const rollup = (log: Logger) => (plaidClient: PlaidApi) => (id: string) => (context: Context): TE.TaskEither<PullerException, Transaction.Internal.t[]> => {
  log.info(`Scheduler.rollup[${id}] - pulling account balances`);
  const accountId = context.source.tag;
  const createdAt = context.source.createdAt;

  return pipe(
      Plaid.getAccounts(plaidClient)(accessToken(context.integration), createdAt, new Date())
    , TE.map((accounts) => {
        log.info(JSON.stringify(accounts))
        return accounts;
      })
    , TE.mapLeft((error) => {
        log.error(error);
        return <PullerException>"Exception";
      })
    , TE.map(A.filter((account: AccountBase) => account.account_id === accountId))
    , TE.chain((accounts) => {
        if (accounts.length !== 1) {
          log.info(JSON.stringify(accounts))
          log.info(`Scheduler.rollup[${id}] - wrong number of matching accounts ${accounts}`);
          return TE.throwError<PullerException, AccountBase>(<PullerException>"Exception");
        } else {
          return TE.of<PullerException, AccountBase>(accounts[0]);
        }
      })
    , TE.map((account) => {
        return <Transaction.Internal.t[]>[{
            id: crypto.randomUUID()
          , sourceId: context.source.id
          , userId: context.source.userId
          , amount: account.balances.current
          , merchantName: ""
          , description: "Starting balance"
          , authorizedAt: context.source.createdAt
          , capturedAt: O.some(context.source.createdAt)
          , metadata: {}
        }];
      })
  );
}

export const rollupFor = (pool: Pool) => (log: Logger) => (plaidClient: PlaidApi) => (id: string) => (context: Context): TE.TaskEither<PullerException, void> => {
  return pipe(
      context
    , rollup(log)(plaidClient)(id)
    , TE.chain(pushTransactions(pool)(log)(id))
  );
}

export const run = (pool: Pool) => (log: Logger) => (plaidClient: PlaidApi) => (id: string): T.Task<boolean> => {
  return pipe(
      pull(pool)(log)
    , TE.chain(withIntegration(pool)(log))
    , TE.map((context) => {
        log.info(`Scheduler.rollup[${id}] - pulling for ${context.source.id}`)
        return context;
      })
    , TE.chain(rollupFor(pool)(log)(plaidClient)(id))
    , TE.match(
          (error) => {
            switch (error) {
              case "NoWork":
                return true;
              default:
                log.error(`Scheduler.rollup[${id}] - failed - ${error}`);
                return true;
            }
          }
        , () => {
            log.info(`Scheduler.rollup[${id}] - completed`);
            return true;
          }
      )
  );
}
