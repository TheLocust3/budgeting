import crypto from "crypto";
import { Pool } from "pg";
import { PlaidApi, TransactionsGetResponse, AccountBase } from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import { Context, PullerException, withIntegration, pushTransactions } from "../util";

import { Exception, Plaid, Pipe } from "../../magic";
import { SourceFrontend, IntegrationFrontend, TransactionFrontend } from "../../storage";
import { Source, Integration, Transaction } from "../../model";

const pull = (pool: Pool): TE.TaskEither<PullerException, Source.Internal.t> => {
  return pipe(
      SourceFrontend.pullForRollup(pool)()
    , TE.mapLeft((error) => {
        switch (error._type) {
          case "NotFound":
            return <PullerException>"NoWork";
          default:
            console.log(error);
            return <PullerException>"Exception"
        }
      })
  );
}

const rollup = (plaidClient: PlaidApi) => (id: string) => (context: Context): TE.TaskEither<PullerException, Transaction.Internal.t[]> => {
  console.log(`Scheduler.rollup[${id}] - pulling account balances`);
  const accountId = context.source.tag;
  const createdAt = context.source.createdAt;

  return pipe(
      Plaid.getAccounts(plaidClient)(context.integration.credentials.accessToken, createdAt, new Date())
    , TE.mapLeft((error) => {
        console.log(error);
        return <PullerException>"Exception";
      })
    , TE.map(A.filter((account: AccountBase) => account.account_id === accountId))
    , TE.chain((accounts) => {
        if (accounts.length !== 1) {
          console.log(`Scheduler.rollup[${id}] - wrong number of matching accounts ${accounts}`);
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

export const run = (pool: Pool) => (plaidClient: PlaidApi) => (id: string): T.Task<boolean> => {
  return pipe(
      pull(pool)
    , TE.chain(withIntegration(pool))
    , TE.map((context) => {
        console.log(`Scheduler.rollup[${id}] - pulling for ${context.source.id}`)
        return context;
      })
    , TE.chain(rollup(plaidClient)(id))
    , TE.chain(pushTransactions(pool)(id))
    , TE.match(
          (error) => {
            switch (error) {
              case "NoWork":
                return true;
              case "Exception":
                console.log(`Scheduler.rollup[${id}] - failed - ${error}`);
                return true;
            }
          }
        , () => {
            console.log(`Scheduler.rollup[${id}] - completed`);
            return true;
          }
      )
  );
}
