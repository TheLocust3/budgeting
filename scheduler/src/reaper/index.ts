import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import SourceFrontend from "../frontend/source-frontend";
import * as PullerJob from "./puller-job";

import { Exception, Reaper } from "magic";
import { Source } from "model";

// on tick:
//   - pull all sources that are "expired"
//   - start puller job for each one
export const tick = async (pool: Pool) => {
  console.log("Scheduler.tick - start");

  await pipe(
      SourceFrontend.allExpired(pool)()
    , TE.map((expiredSources: Source.Internal.t[]) => {
        console.log(`Scheduler.tick - found ${expiredSources.length} expired sources`);
        return expiredSources;
      })
    , TE.map(A.map((expired) => {
        Reaper.enqueue(PullerJob.run(pool)(expired));
      }))
  )();

  setTimeout(() => tick(pool), 5000);
}
