import { Pool } from "pg";
import { PlaidApi, TransactionsGetResponse } from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import SourceFrontend from "../frontend/source-frontend";
import IntegrationFrontend from "../frontend/integration-frontend";
import TransactionFrontend from "../frontend/transaction-frontend";

import { Source, Integration, Transaction } from "model";

// given a source:
//   1) try to get the "lock" (mark a source as `active` if it's still expired)
//   2) pull the credentials for the source
//   3) send all transactions after `source.createdAt` to the rules engine

type Context = {
  source: Source.Internal.t;
  integration: Integration.Internal.t;
};

type PullerException = "LockAcquisitionFailed" | "Exception";

const tryLock = (pool: Pool) => (source: Source.Internal.t): TE.TaskEither<PullerException, Source.Internal.t> => {
  return pipe(
      source.id
    , SourceFrontend.tryLockById(pool)
    , TE.mapLeft((_) => <PullerException>"Exception")
    , TE.chain((hasLock) => {
      if (hasLock) {
        return TE.of(source);
      } else {
        return TE.throwError(<PullerException>"LockAcquisitionFailed")
      }
    })
  );
}

const withIntegration = (pool: Pool) => (source: Source.Internal.t): TE.TaskEither<PullerException, Integration.Internal.t> => {
  // at this point, an integration id must exist
  const integrationId = O.match(() => "", (integrationId: string) => integrationId)(source.integrationId);
  return pipe(
      integrationId
    , IntegrationFrontend.getById(pool)
    , TE.mapLeft(() => <PullerException>"Exception")
  );
}

const pullTransactions = (plaidClient: PlaidApi) => (context: Context): TE.TaskEither<PullerException, Transaction.Internal.t[]> => {
  // INVARIANT: the accountId must exist on `source`
  const accountId = O.match(() => "", (metadata: Source.Internal.PlaidMetadata) => metadata.accountId)(context.source.metadata);

  const pull = (): TE.TaskEither<PullerException, TransactionsGetResponse> => {
    return TE.tryCatch(
        async () => {
          // INVARIANT: the createdAt must exist on `source`
          const createdAt = O.match(() => new Date(), (createdAt: Date) => createdAt)(context.source.createdAt);

          const response = await plaidClient.transactionsGet({
              access_token: context.integration.credentials.accessToken
            , start_date: String(createdAt)
            , end_date: String(new Date())
          });

          return response.data;
        }
      , (_) => <PullerException>"Exception"
    );
  }

  return pipe(
      pull()
    , TE.map((response) => response.transactions)
    , TE.map(A.filter((transaction) => transaction.account_id === accountId))
    , TE.map(A.map((transaction) => {
        return <Transaction.Internal.t>{
            sourceId: context.source.id
          , userId: context.source.userId
          , amount: transaction.amount
          , merchantName: String(transaction.merchant_name)
          , description: String(transaction.original_description)
          , authorizedAt: new Date(String(transaction.authorized_datetime))
          , capturedAt: O.none // TODO: JK
        };
      }))
  );
}

const pushTransactions = (pool: Pool) => (transactions: Transaction.Internal.t[]): TE.TaskEither<PullerException, void> => {
  const push = (transaction: Transaction.Internal.t): TE.TaskEither<PullerException, void> => {
    return pipe(
        transaction
      , TransactionFrontend.create(pool)
      , TE.mapLeft(() => <PullerException>"Exception")
      , TE.map((_) => { return; })
    );
  }

  return pipe(
      transactions
    , A.map(push)
    , A.sequence(TE.ApplicativeSeq)
    , TE.map((_) => { return; })
  );
}

export const run = (pool: Pool) => (plaidClient: PlaidApi) => (source: Source.Internal.t) => (id: string) => {
  console.log(`Scheduler.puller[${id}] - start for ${source.id}`)

  return pipe(
      source
    , tryLock(pool)
    , TE.chain(withIntegration(pool))
    , TE.map((integration) => { return { source: source, integration: integration }; })
    , TE.chain(pullTransactions(plaidClient))
    , TE.chain(pushTransactions(pool))
    , TE.match(
          (error) => {
            console.log(`Scheduler.puller[${id}] - failed for ${source.id} - ${error}`);
            switch (error) {
              case "LockAcquisitionFailed":
                return true; // somebody else already updated this source
              case "Exception":
                return false; // retry
            }
          }
        , () => {
            console.log(`Scheduler.puller[${id}] - completed for ${source.id}`);
            return true;
          }
      )
  );
}
