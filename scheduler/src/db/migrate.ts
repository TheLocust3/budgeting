import { Pool } from "pg";

import * as SourcesTable from "./sources-table";

const migrate = async (pool: Pool) => {
  await SourcesTable.migrate(pool)();
  console.log("Migrate complete");
  process.exit(0);
};

console.log("Migrate start");

export const pool = new Pool();
migrate(pool);
