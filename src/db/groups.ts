import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as iot from 'io-ts';

import * as Group from '../model/Group';

namespace Query {
  export const createTable = `
    CREATE TABLE groups (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL
    )
  `;

  export const dropTable = `DROP TABLE groups`

  export const create = (name: string) => {
    return {
      text: `
        INSERT INTO groups (name)
        VALUES ($1)
        RETURNING *
      `,
      values: [name]
    }
  }
}

export const migrate = (pool: Pool): T.Task<Boolean> => async () => {
  try {
    await pool.query(Query.createTable);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const rollback = (pool: Pool): T.Task<Boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const create = (pool: Pool) => (group: Group.Internal.t) : TE.TaskEither<Error, Group.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(group.name)),
        E.toError
      )
    , TE.chain(res => {
        if (res.rows.length < 1) {
          return TE.left(new Error("Empty response"));
        } else {
          return TE.right(res.rows);
        }
      })
    , TE.chain(row => TE.fromEither(Group.Database.lift(row[0])))
  );
}
