import { Pool } from "pg";

import * as Accounts from "./accounts";
import * as Rules from "./rules";

const migrate = async (pool: Pool) => {
  await Accounts.migrate(pool)();
  await Rules.migrate(pool)();
  console.log("Migrate complete");
  process.exit(0);
};

console.log("Migrate start");

export const pool = new Pool();
migrate(pool);
