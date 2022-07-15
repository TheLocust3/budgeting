import { Pool } from "pg";

import * as UsersTable from "./users-table";
import * as SourcesTable from "./sources-table";
import * as IntegrationsTable from "./integrations-table";
import * as TransactionsTable from "./transactions-table";
import * as AccountsTable from "./accounts-table";
import * as RulesTable from "./rules-table";
import * as NotificationsTable from "./notifications-table";

export const migrate = async (pool: Pool) => {
  await UsersTable.migrate(pool)();
  await IntegrationsTable.migrate(pool)();
  await SourcesTable.migrate(pool)();

  await TransactionsTable.migrate(pool)();
  await AccountsTable.migrate(pool)();
  await RulesTable.migrate(pool)();

  await UsersTable.migrate001(pool)();
  await AccountsTable.migrate001(pool)();
  await TransactionsTable.migrate001(pool)();

  await NotificationsTable.migrate(pool)();

  await NotificationsTable.migrate001(pool)();
};
