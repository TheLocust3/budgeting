import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import SourceFrontend from "../frontend/source-frontend";
import IntegrationFrontend from "../frontend/integration-frontend";

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

const pullTransactions = (context: Context): TE.TaskEither<PullerException, Transaction.Internal.t[]> => {
  return TE.of([]); // TODO: JK
}

const pushTransactions = (transaction: Transaction.Internal.t[]): TE.TaskEither<PullerException, void> => {
  const push = (transaction: Transaction.Internal.t): TE.TaskEither<PullerException, boolean> => {
    return TE.of(true); // TODO: JK
  }

  return pipe(
      transaction
    , A.map(push)
    , A.sequence(TE.ApplicativeSeq)
    , TE.map((_) => { return; })
  );
}

export const run = (pool: Pool) => (source: Source.Internal.t) => (id: string) => {
  console.log(`Scheduler.puller[${id}] - start for ${source.id}`)

  return pipe(
      source
    , tryLock(pool)
    , TE.chain(withIntegration(pool))
    , TE.map((integration) => { return { source: source, integration: integration }; })
    , TE.chain(pullTransactions)
    , TE.chain(pushTransactions)
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
