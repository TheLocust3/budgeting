import { Pool } from "pg";
import { Logger } from "pino";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Source } from "../../model";
import { Db, Exception } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE sources (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      user_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      name TEXT NOT NULL,
      integration_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      last_refreshed TIMESTAMP NOT NULL DEFAULT now(),
      FOREIGN KEY(integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, tag)
    )
  `;

  export const dropTable = "DROP TABLE sources";

  export const create = (id: string, userId: string, name: string, integrationId: string | null, tag: string) => {
    return {
      text: `
        INSERT INTO sources (id, user_id, name, integration_id, tag)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id)
        DO UPDATE SET user_id=excluded.user_id, name=excluded.name, integration_id=excluded.integration_id, tag=excluded.tag
        RETURNING *
      `,
      values: [id, userId, name, integrationId, tag]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id, tag, created_at
        FROM sources
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byId = (userId: string, id: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id, tag, created_at
        FROM sources
        WHERE user_id = $1 AND id = $2
        LIMIT 1
      `,
      values: [userId, id]
    };
  };

  export const byIntegrationId = (userId: string, integrationId: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id, tag, created_at
        FROM sources
        WHERE user_id = $1 AND integration_id = $2
      `,
      values: [userId, integrationId]
    };
  };

  export const withoutIntegrationId = (userId: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id, tag, created_at
        FROM sources
        WHERE user_id = $1 AND integration_id IS NULL
      `,
      values: [userId]
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

  export const pullForRollup = `
    UPDATE sources
    SET last_refreshed = to_timestamp(0)
    WHERE id IN (
      SELECT id
      FROM sources
      WHERE last_refreshed IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    )
    RETURNING id, user_id, name, integration_id, tag, created_at
  `;

  const isExpired = `last_refreshed IS NOT NULL AND last_refreshed < now() - '10 minutes' :: interval AND integration_id IS NOT NULL`

  export const pull = `
    UPDATE sources
    SET last_refreshed = now()
    WHERE id IN (
      SELECT id
      FROM sources
      WHERE ${isExpired}
      ORDER BY last_refreshed DESC
      LIMIT 1
    )
    RETURNING id, user_id, name, integration_id, tag, created_at
  `;
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

export const all = (pool: Pool) => (log: Logger) => (userId: string) : TE.TaskEither<Exception.t, Source.Internal.t[]> => {
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
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const byId = (pool: Pool) => (log: Logger) => (userId: string) => (id: string) : TE.TaskEither<Exception.t, O.Option<Source.Internal.t>> => {
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
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const byIntegrationId = (pool: Pool) => (log: Logger) => (userId: string) => (integrationId: string) : TE.TaskEither<Exception.t, Source.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byIntegrationId(userId, integrationId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const withoutIntegrationId = (pool: Pool) => (log: Logger) => (userId: string) : TE.TaskEither<Exception.t, Source.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.withoutIntegrationId(userId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string) : TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(userId, id)),
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

export const create = (pool: Pool) => (log: Logger) => (source: Source.Frontend.Create.t) : TE.TaskEither<Exception.t, Source.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(
            source.id
          , source.userId
          , source.name
          , O.match(() => null, (id: string) => id)(source.integrationId)
          , source.tag
        )),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Source.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const pull = (pool: Pool) => (log: Logger) => () : TE.TaskEither<Exception.t, O.Option<Source.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.pull),
        (e) => {
          log.error(e)
          throw e;
        }
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const pullForRollup = (pool: Pool) => (log: Logger) => () : TE.TaskEither<Exception.t, O.Option<Source.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.pullForRollup),
        (e) => {
          log.error(e)
          throw e;
        }
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};
