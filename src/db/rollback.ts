import { Pool } from 'pg';

import * as Transactions from './transactions'
import * as Accounts from './accounts'
import * as Rules from './rules'

const rollback = async (pool: Pool) => {
  await Rules.rollback(pool)();
  await Accounts.rollback(pool)();
  await Transactions.rollback(pool)();
  console.log("Rollback complete");
  process.exit(0);
}

console.log("Rollback start");

export const pool = new Pool()
rollback(pool);
