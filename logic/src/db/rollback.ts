import { Pool } from "pg";

import * as UsersTable from "./users-table";
import * as SourcesTable from "./sources-table";
import * as IntegrationsTable from "./integrations-table";

const rollback = async (pool: Pool) => {
  await SourcesTable.rollback(pool)();
  await IntegrationsTable.rollback(pool)();
  await UsersTable.rollback(pool)();
  console.log("Rollback complete");
  process.exit(0);
};

console.log("Rollback start");

export const pool = new Pool();
rollback(pool);
