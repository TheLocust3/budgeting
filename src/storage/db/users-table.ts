import { Pool } from "pg";
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
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `;

  export const migrate001 = `
    ALTER TABLE users
    ADD CONSTRAINT user_unq UNIQUE(email)
  `;

  export const migrate002 = `
    ALTER TABLE users
    DROP CONSTRAINT user_unq
  `;

  export const dropTable = "DROP TABLE users";

  export const create = (id: string, email: string, password: string, role: string) => {
    return {
      text: `
        INSERT INTO users (id, email, password, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET email=excluded.email, password=excluded.password, role=excluded.role
        RETURNING *
      `,
      values: [id, email, password, role]
    };
  };

  export const all = `
    SELECT id, email, password, role
    FROM users
  `;

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, email, password, role
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
        SELECT id, email, password, role
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
        RETURNING id, email, password, role
      `,
      values: [id, role]
    };
  };
}

export const migrate = (pool: Pool): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.createTable);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const migrate001 = (pool: Pool): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.migrate001);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const migrate002 = (pool: Pool): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.migrate002);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const rollback = (pool: Pool): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const all = (pool: Pool) => () : TE.TaskEither<Exception.t, User.Internal.t[]> => {
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
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Exception.t, O.Option<User.Internal.t>> => {
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
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const byEmail = (pool: Pool) => (email: string) : TE.TaskEither<Exception.t, O.Option<User.Internal.t>> => {
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
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const deleteById = (pool: Pool) => (id: string) : TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id)),
        E.toError
      )
    , TE.mapLeft(Exception.pgRaise)
    , TE.chain(x => {
        if (x.rowCount <= 0) {
          return TE.throwError(Exception.throwNotFound);
        } else {
          return TE.of(undefined);
        }
      })
  );
};

export const create = (pool: Pool) => (user: User.Frontend.Create.t) : TE.TaskEither<Exception.t, User.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(user.id, user.email, user.password, user.role)),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], User.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const setRole = (pool: Pool) => (role: string) => (id: string) : TE.TaskEither<Exception.t, User.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.setRole(id, role)),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], User.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise)
  );
};
