import _ from "lodash";
import { PlaidApi } from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as PullerJob from "./puller-job";

import { Exception, Reaper } from "magic";
import { UserFrontend, IntegrationFrontend } from "storage";

// on tick:
//   - pull all sources that are "expired"
//   - start puller job for each one
export const tick = async (plaidClient: PlaidApi) => {
  console.log("Scheduler.tick - start");

  // TODO: Jk
  /*try {
    await pipe(
        UserFrontend.list()
      , TE.map(_.shuffle) // shuffle to reduce conflicts between scheduler instances
      , TE.map((expiredSources: Source.Internal.t[]) => {
          console.log(`Scheduler.tick - found ${expiredSources.length} expired sources`);
          return expiredSources;
        })
      , TE.map(A.map((expired) => {
          Reaper.enqueue(PullerJob.run(pool)(plaidClient)(expired));
        }))
    )();
  } catch (error) {
    console.log(error);
  }*/

  setTimeout(() => tick(plaidClient), 5000);
}
