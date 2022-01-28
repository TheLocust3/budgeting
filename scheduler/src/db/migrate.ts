import { Pool } from "pg";

import * as SourcesTable from "./sources-table";
import * as IntegrationsTable from "./integrations-table";

const migrate = async (pool: Pool) => {
  await IntegrationsTable.migrate(pool)();
  await SourcesTable.migrate(pool)();
  console.log("Migrate complete");
  process.exit(0);
};

console.log("Migrate start");

export const pool = new Pool();
migrate(pool);
