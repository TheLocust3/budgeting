import { Pool } from 'pg';

const migrate = async (pool: Pool) => {
  console.log("Migrate complete");
  process.exit(0);
}

console.log("Migrate start");

export const pool = new Pool();
migrate(pool);
