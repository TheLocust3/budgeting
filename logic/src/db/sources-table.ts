import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Source } from "model";
import { Db } from "magic";

namespace Query {
  export const createTable = `
    CREATE TABLE sources (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      integration_id TEXT,
      FOREIGN KEY(integration_id) REFERENCES integrations(id) ON DELETE CASCADE
    )
  `;

  export const dropTable = "DROP TABLE sources";

  export const create = (userId: string, name: string, integrationId: string | null) => {
    return {
      text: `
        INSERT INTO sources (user_id, name, integration_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      values: [userId, name, integrationId]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id
        FROM sources
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byId = (userId: string, id: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id
        FROM sources
        WHERE user_id = $1 AND id = $2
        LIMIT 1
      `,
      values: [userId, id]
    };
  };

  export const deleteById = (userId: string, id: string) => {
    return {
      text: `
        DELETE FROM sources
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

export const all = (pool: Pool) => (userId: string) : TE.TaskEither<Error, Source.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all(userId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
  );
};

export const byId = (pool: Pool) => (userId: string) => (id: string) : TE.TaskEither<Error, O.Option<Source.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(userId, id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
  );
};

export const deleteById = (pool: Pool) => (userId: string) => (id: string) : TE.TaskEither<Error, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(userId, id)),
        E.toError
      )
    , TE.map(x => { return; })
  );
};

export const create = (pool: Pool) => (source: Source.Internal.t) : TE.TaskEither<Error, Source.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(source.userId, source.name, O.match(() => null, (id: string) => id)(source.integrationId))),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Source.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
  );
};
