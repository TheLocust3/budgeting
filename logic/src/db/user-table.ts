import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as iot from 'io-ts';

import * as User from '../model/User';
import { Db } from 'magic';

namespace Query {
  export const createTable = `
    CREATE TABLE users (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `;

  export const dropTable = `DROP TABLE users`

  export const create = (email: string, password: string) => {
    return {
      text: `
        INSERT INTO users (email, password)
        VALUES ($1, $2)
        RETURNING *
      `,
      values: [email, password]
    }
  }

  export const all = `
    SELECT id, email, password
    FROM users
  `

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, email, password
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    }
  }

  export const deleteById = (id: string) => {
    return {
      text: `
        DELETE FROM users
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

export const all = (pool: Pool) => () : TE.TaskEither<Error, User.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(User.Database.from)
        , A.sequence(E.Applicative)
      )))
  );
}

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<User.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(User.Database.from)
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
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

export const create = (pool: Pool) => (user: User.Internal.t) : TE.TaskEither<Error, User.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(user.email, user.password)),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => TE.fromEither(User.Database.from(res.rows[0])))
  );
}
