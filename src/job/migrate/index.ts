import { Pool } from "pg";

import { migrate as migrateStorage } from "../../storage/db/migrate";
import { migrate as migrateLogic } from "../../logic/migrate";

const pool = new Pool();

const run = async () => {
  console.log("Migrate start");
  await migrateStorage(pool);
  await migrateLogic(pool);

  console.log("Migrate complete");
  process.exit(0);
}

run();
