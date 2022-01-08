import { Pool } from 'pg';
import { Task } from 'fp-ts/lib/Task'

namespace Query {
  export const createTable = `
    CREATE TABLE accounts (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      groupId TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `;

  export const dropTable = `DROP TABLE accounts`
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
