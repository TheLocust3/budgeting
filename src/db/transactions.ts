import { Task } from 'fp-ts/lib/Task'

import * as db from './index';

namespace Query {
  export const createTable = `
    CREATE TABLE transactions (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      sourceId TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      merchantName TEXT NOT NULL,
      description TEXT NOT NULL,
      authorizedAt DATE NOT NULL,
      capturedAt DATE,
      metadata JSONB NOT NULL
    )
  `;

  export const dropTable = `DROP TABLE transactions`
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
