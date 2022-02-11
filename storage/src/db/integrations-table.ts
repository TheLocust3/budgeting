import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Integration } from "model";
import { Db } from "magic";

namespace Query {
  export const createTable = `
    CREATE TABLE integrations (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      credentials JSONB NOT NULL
    )
  `;

  export const dropTable = "DROP TABLE integrations";

  export const create = (userId: string, name: string, credentials: any) => {
    return {
      text: `
        INSERT INTO integrations (user_id, name, credentials)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      values: [userId, name, credentials]
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

export const all = (pool: Pool) => (userId: string) : TE.TaskEither<Error, Integration.Internal.t[]> => {
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
  );
};

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<Integration.Internal.t>> => {
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
  );
};

export const deleteById = (pool: Pool) => (userId: string) => (id: string) : TE.TaskEither<Error, void> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.deleteById(userId, id))
        , E.toError
      )
    , TE.map(x => { return; })
  );
};

export const create = (pool: Pool) => (integration: Integration.Frontend.Create.t) : TE.TaskEither<Error, Integration.Internal.t> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.create(integration.userId, integration.name, integration.credentials))
        , E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Integration.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
  );
};
