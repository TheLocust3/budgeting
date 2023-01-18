import crypto from "crypto";
import { Pool } from "pg";
import pino from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import * as PullerJob from "./puller-job";

import { Exception, Plaid } from "../../magic";
import { SourceFrontend } from "../../storage";
import { Source } from "../../model";

const plaidClient = Plaid.buildClient();
const pool = new Pool();
const log = pino();
const id = crypto.randomUUID();

const run = async () => {
  log.info(`Scheduler.puller[${id}] - start`)
  
  await PullerJob.run(pool)(log)(plaidClient)(id)();

  log.info(`Scheduler.puller[${id}] - complete`)
  process.exit(0);
}

run();
