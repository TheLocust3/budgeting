import { Pool } from 'pg';

import * as UsersTable from './users-table';

const rollback = async (pool: Pool) => {
  await UsersTable.rollback(pool)();
  console.log("Rollback complete");
  process.exit(0);
}

console.log("Rollback start");

export const pool = new Pool();
rollback(pool);
