import { Pool } from "pg";

import * as UsersTable from "./users-table";
import * as SourcesTable from "./sources-table";
import * as IntegrationsTable from "./integrations-table";
import * as TransactionsTable from "./transactions-table";
import * as AccountsTable from "./accounts-table";
import * as RulesTable from "./rules-table";
import * as NotificationsTable from "./notifications-table";
import * as TemplatesTable from "./templates-table";

const rollback = async (pool: Pool) => {
  await TemplatesTable.rollback(pool)();
  await NotificationsTable.rollback(pool)();

  await SourcesTable.rollback(pool)();
  await IntegrationsTable.rollback(pool)();
  await UsersTable.rollback(pool)();

  await RulesTable.rollback(pool)();
  await AccountsTable.rollback(pool)();
  await TransactionsTable.rollback(pool)();

  console.log("Rollback complete");
  process.exit(0);
};

console.log("Rollback start");

export const pool = new Pool();
rollback(pool);
