import { Task } from 'fp-ts/lib/Task'

import * as db from './index';

namespace Query {
  export const createTable = `
    CREATE TABLE rules (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL
    )
  `;

  export const dropTable = `DROP TABLE rules`
}

export const migrate: Task<Boolean> = async () => {
  try {
    await db.pool.query(Query.createTable);
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

export const rollback: Task<Boolean> = async () => {
  try {
    await db.pool.query(Query.dropTable);
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}
