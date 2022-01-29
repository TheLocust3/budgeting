import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import SourceFrontend from "../frontend/source-frontend";
import IntegrationFrontend from "../frontend/integration-frontend";

import { Source, Integration } from "model";

type PullerException = "LockAcquisitionFailed" | "Exception"

// given a source:
//   1) try to get the "lock" (mark a source as `active` if it's still expired)
//   2) pull the credentials for the source
//   3) send all transactions after `source.createdAt` to the rules engine
export const run = (pool: Pool) => (source: Source.Internal.t) => (id: string) => {
  console.log(`Scheduler.puller[${id}] - start for ${source.id}`)

  return pipe(
      source.id
    , SourceFrontend.tryLockById(pool)
    , TE.mapLeft((_) => <PullerException>"Exception")
    , TE.chain((hasLock) => {
        if (hasLock) {
          return TE.of(true);
        } else {
          return TE.throwError(<PullerException>"LockAcquisitionFailed")
        }
      })
    , TE.chain((_) => {
        // at this point, an integration id must exist
        const integrationId = O.match(() => "", (integrationId: string) => integrationId)(source.integrationId);
        return pipe(
            integrationId
          , IntegrationFrontend.getById(pool)
          , TE.mapLeft(() => <PullerException>"Exception")
        );
      })
    , TE.chain((integration: Integration.Internal.t) => {
        // TODO: JK pull transactions
        return TE.of(true);
      })
    , TE.match(
          (error) => {
            switch (error) {
              case "LockAcquisitionFailed":
                return true; // somebody else already updated this source
              case "Exception":
                return false; // retry
            }
          }
        , () => true
      )
  );
}