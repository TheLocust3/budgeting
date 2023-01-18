import { Pool } from "pg";
import pino, { Logger } from "pino";

import * as UsersTable from "./users-table";
import * as SourcesTable from "./sources-table";
import * as IntegrationsTable from "./integrations-table";
import * as TransactionsTable from "./transactions-table";
import * as AccountsTable from "./accounts-table";
import * as RulesTable from "./rules-table";
import * as NotificationsTable from "./notifications-table";
import * as TemplatesTable from "./templates-table";

const rollback = (pool: Pool) => async (log: Logger) => {
  await TemplatesTable.rollback(pool)(log)();
  await NotificationsTable.rollback(pool)(log)();

  await SourcesTable.rollback(pool)(log)();
  await IntegrationsTable.rollback(pool)(log)();
  await UsersTable.rollback(pool)(log)();

  await RulesTable.rollback(pool)(log)();
  await AccountsTable.rollback(pool)(log)();
  await TransactionsTable.rollback(pool)(log)();

  log.info("Rollback complete");
  process.exit(0);
};

const pool = new Pool();
const log = pino();

log.info("Rollback start");
rollback(pool)(log);
