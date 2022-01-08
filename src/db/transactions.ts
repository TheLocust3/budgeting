import { Pool } from 'pg';
import { Task } from 'fp-ts/lib/Task'

namespace Query {
  export const createTable = `
    CREATE TABLE transactions (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      merchant_name TEXT NOT NULL,
      description TEXT NOT NULL,
      authorized_at DATE NOT NULL,
      captured_at DATE,
      metadata JSONB NOT NULL
    )
  `;

  export const dropTable = `DROP TABLE transactions`
}

export const migrate = (pool: Pool): Task<Boolean> => async () => {
  try {
    await pool.query(Query.createTable);
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

export const rollback = (pool: Pool): Task<Boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}
