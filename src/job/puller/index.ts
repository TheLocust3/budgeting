import crypto from "crypto";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import * as PullerJob from "./puller-job";

import { Exception, Reaper } from "../../magic";
import { SourceFrontend } from "../../storage";
import { Source } from "../../model";

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.development,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);
const pool = new Pool();
const id = crypto.randomUUID();

const run = async () => {
  console.log(`Scheduler.puller[${id}] - start`)
  
  await PullerJob.run(pool)(plaidClient)(id)();

  console.log(`Scheduler.puller[${id}] - complete`)
  process.exit(0);
}

run();
