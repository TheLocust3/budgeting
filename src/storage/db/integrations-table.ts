import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Integration } from "../../model";
import { Db, Exception } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE integrations (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      credentials JSONB NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  export const dropTable = "DROP TABLE integrations";

  export const create = (id: string, userId: string, name: string, credentials: any) => {
    return {
      text: `
        INSERT INTO integrations (id, user_id, name, credentials)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET user_id=excluded.user_id, name=excluded.name, credentials=excluded.credentials
        RETURNING *
      `,
      values: [id, userId, name, credentials]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, user_id, name, credentials
        FROM integrations
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, user_id, name, credentials
        FROM integrations
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    };
  };

  export const deleteById = (userId: string, id: string) => {
    return {
      text: `
        DELETE FROM integrations
        WHERE user_id = $1 AND id = $2
      `,
      values: [userId, id]
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

export const rollback = (pool: Pool): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const all = (pool: Pool) => (userId: string) : TE.TaskEither<Exception.t, Integration.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.all(userId))
        , E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Integration.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.raise)
  );
};

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Exception.t, O.Option<Integration.Internal.t>> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.byId(id))
        , E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Integration.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
    , TE.mapLeft(Exception.raise)
  );
};

export const deleteById = (pool: Pool) => (userId: string) => (id: string) : TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.deleteById(userId, id))
        , E.toError
      )
    , TE.mapLeft(Exception.raise)
    , TE.chain(x => {
        if (x.rowCount <= 0) {
          return TE.throwError(Exception.throwNotFound);
        } else {
          return TE.of(undefined);
        }
      })
  );
};

export const create = (pool: Pool) => (integration: Integration.Frontend.Create.t) : TE.TaskEither<Exception.t, Integration.Internal.t> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.create(integration.id, integration.userId, integration.name, integration.credentials))
        , E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Integration.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.raise)
  );
};
