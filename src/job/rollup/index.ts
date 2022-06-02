import crypto from "crypto";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import * as RollupJob from "./rollup-job";

import { Exception, Reaper, Plaid } from "../../magic";
import { SourceFrontend } from "../../storage";
import { Source } from "../../model";

const plaidClient = Plaid.buildClient();
const pool = new Pool();
const id = crypto.randomUUID();

const run = async () => {
  console.log(`Scheduler.rollup[${id}] - start`)

  await RollupJob.run(pool)(plaidClient)(id)();

  console.log(`Scheduler.rollup[${id}] - complete`)
  process.exit(0);
}

run();
