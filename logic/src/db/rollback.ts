import { Pool } from 'pg';

const rollback = async (pool: Pool) => {
  console.log("Rollback complete");
  process.exit(0);
}

console.log("Rollback start");

export const pool = new Pool();
rollback(pool);
