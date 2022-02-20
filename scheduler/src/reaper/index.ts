import { Pool } from "pg";
import { PlaidApi } from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as PullerJob from "./puller-job";

import { Exception, Reaper } from "magic";
import { SourceFrontend } from "storage";
import { Source } from "model";

// on tick:
//   - pull all sources that are "expired"
//   - start puller job for each one
export const tick = (pool: Pool) => (plaidClient: PlaidApi) => {
  Reaper.enqueue(PullerJob.run(pool)(plaidClient));
  setTimeout(() => tick(pool)(plaidClient), 500);
}
