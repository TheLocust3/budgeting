import { Pool } from "pg";

import * as SourcesTable from "./sources-table";

const rollback = async (pool: Pool) => {
  await SourcesTable.rollback(pool)();
  console.log("Rollback complete");
  process.exit(0);
};

console.log("Rollback start");

export const pool = new Pool();
rollback(pool);
