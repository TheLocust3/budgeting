import { Pool } from "pg";
import { Logger } from "pino";

import * as UsersTable from "./users-table";
import * as SourcesTable from "./sources-table";
import * as IntegrationsTable from "./integrations-table";
import * as TransactionsTable from "./transactions-table";
import * as AccountsTable from "./accounts-table";
import * as RulesTable from "./rules-table";
import * as NotificationsTable from "./notifications-table";
import * as TemplatesTable from "./templates-table";

export const migrate = (pool: Pool) => async (log: Logger) => {
  await UsersTable.migrate(pool)(log)();
  await IntegrationsTable.migrate(pool)(log)();
  await SourcesTable.migrate(pool)(log)();

  await TransactionsTable.migrate(pool)(log)();
  await AccountsTable.migrate(pool)(log)();
  await RulesTable.migrate(pool)(log)();

  await AccountsTable.migrate001(pool)(log)();
  await TransactionsTable.migrate001(pool)(log)();

  await NotificationsTable.migrate(pool)(log)();

  await NotificationsTable.migrate001(pool)(log)();

  await TemplatesTable.migrate(pool)(log)();
};
