import { Pool } from "pg";
import pino from "pino";

import { migrate as migrateStorage } from "../../storage/db/migrate";
import { migrate as migrateLogic } from "../../logic/migrate";

const pool = new Pool();
const log = pino();

const run = async () => {
  log.info("Migrate start");
  await migrateStorage(pool)(log);
  await migrateLogic(pool)(log);

  log.info("Migrate complete");
}

run();
