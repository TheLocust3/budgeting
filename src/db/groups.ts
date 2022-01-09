import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
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

  export const all = `
    SELECT id, name
    FROM groups
  `;

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, name
        FROM groups
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    }
  }

  export const deleteById = (id: string) => {
    return {
      text: `
        DELETE FROM groups
        WHERE id = $1
      `,
      values: [id]
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

export const all = (pool: Pool) => () : TE.TaskEither<Error, Group.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Group.Database.lift)
        , A.sequence(E.Applicative)
      )))
  );
}

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<Group.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Group.Database.lift)
        , A.sequence(E.Applicative)
      )))
    , TE.map(groups => {
        if (groups.length == 1) {
          return O.some(groups[0])
        } else {
          return O.none;
        }
      })
  );
}

export const deleteById = (pool: Pool) => (id: string) : TE.TaskEither<Error, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id)),
        E.toError
      )
    , TE.map(x => { return })
  );
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
