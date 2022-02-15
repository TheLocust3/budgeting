import { Pool } from "pg";

import * as UsersTable from "./users-table";
import * as SourcesTable from "./sources-table";
import * as IntegrationsTable from "./integrations-table";
import * as TransactionsTable from "./transactions-table";
import * as AccountsTable from "./accounts-table";
import * as RulesTable from "./rules-table";

const migrate = async (pool: Pool) => {
  await UsersTable.migrate(pool)();
  await IntegrationsTable.migrate(pool)();
  await SourcesTable.migrate(pool)();

  await TransactionsTable.migrate(pool)();
  await AccountsTable.migrate(pool)();
  await RulesTable.migrate(pool)();

  console.log("Migrate complete");
  process.exit(0);
};

console.log("Migrate start");

export const pool = new Pool();
migrate(pool);
