import { Pool } from "pg";
import { Logger } from "pino";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { User } from "../../model";
import { Db, Exception } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE users (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      email TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `;

  export const dropTable = "DROP TABLE users";

  export const create = (id: string, email: string, role: string) => {
    return {
      text: `
        INSERT INTO users (id, email, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (id)
        DO UPDATE SET email=excluded.email, role=excluded.role
        RETURNING *
      `,
      values: [id, email, role]
    };
  };

  export const all = `
    SELECT id, email, role
    FROM users
  `;

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, email, role
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    };
  };

    export const byEmail = (email: string) => {
    return {
      text: `
        SELECT id, email, role
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      values: [email]
    };
  };

  export const deleteById = (id: string) => {
    return {
      text: `
        DELETE FROM users
        WHERE id = $1
      `,
      values: [id]
    };
  };

  export const setRole = (id: string, role: string) => {
    return {
      text: `
        UPDATE users
        SET role = $2
        WHERE id = $1
        RETURNING id, email, role
      `,
      values: [id, role]
    };
  };
}

export const migrate = (pool: Pool) => (log: Logger): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.createTable);
    return true;
  } catch (err) {
    log.error(err);
    return false;
  }
};

export const rollback = (pool: Pool) => (log: Logger): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch (err) {
    log.error(err);
    return false;
  }
};

export const all = (pool: Pool) => (log: Logger) => () : TE.TaskEither<Exception.t, User.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(User.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const byId = (pool: Pool) => (log: Logger) => (id: string) : TE.TaskEither<Exception.t, O.Option<User.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(User.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const byEmail = (pool: Pool) => (log: Logger) => (email: string) : TE.TaskEither<Exception.t, O.Option<User.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byEmail(email)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(User.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const deleteById = (pool: Pool) => (log: Logger) => (id: string) : TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id)),
        E.toError
      )
    , TE.mapLeft(Exception.pgRaise(log))
    , TE.chain(x => {
        if (x.rowCount <= 0) {
          return TE.throwError(Exception.throwNotFound);
        } else {
          return TE.of(undefined);
        }
      })
  );
};

export const create = (pool: Pool) => (log: Logger) => (user: User.Frontend.Create.t) : TE.TaskEither<Exception.t, User.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(user.id, user.email, user.role)),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], User.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const setRole = (pool: Pool) => (log: Logger) => (role: string) => (id: string) : TE.TaskEither<Exception.t, User.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.setRole(id, role)),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], User.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};
