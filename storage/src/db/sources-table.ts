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
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      last_refreshed TIMESTAMP NOT NULL DEFAULT to_timestamp(0),
      FOREIGN KEY(integration_id) REFERENCES integrations(id) ON DELETE CASCADE
    )
  `;

  export const dropTable = "DROP TABLE sources";

  export const create = (userId: string, name: string, integrationId: string | null, metadata: object | null) => {
    return {
      text: `
        INSERT INTO sources (user_id, name, integration_id, metadata)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      values: [userId, name, integrationId, metadata]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id, metadata, created_at
        FROM sources
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byId = (userId: string, id: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id, metadata, created_at
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

  const isExpired = `last_refreshed < now() - '10 minutes' :: interval AND integration_id IS NOT NULL`

  export const allExpired = `
    SELECT id, user_id, name, integration_id, metadata, created_at
    FROM sources
    WHERE ${isExpired}
  `;

  export const tryLockById = (id: string) => {
    return {
      text: `
        UPDATE sources
        SET last_refreshed = now()
        WHERE id = $1 AND (${isExpired})
        RETURNING *
      `,
      values: [id]
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
        () => pool.query(Query.create(
            source.userId
          , source.name
          , O.match(() => null, (id: string) => id)(source.integrationId)
          , O.match(() => null, (metadata: object) => metadata)(source.metadata)
        )),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Source.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
  );
};

export const allExpired = (pool: Pool) => () : TE.TaskEither<Error, Source.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.allExpired),
        (e) => {
          console.log(e)
          throw e;
        }
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
  );
};

export const tryLockById = (pool: Pool) => (id: string) : TE.TaskEither<Error, boolean> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.tryLockById(id))
        , E.toError
      )
    , TE.map((res) => res.rows.length === 1) // if we managaed to update a single row, we've acquired the "lock"
  );
};
