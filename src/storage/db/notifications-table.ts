import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Notification } from "../../model";
import { Db, Exception } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE notifications (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      acked BOOLEAN NOT NULL DEFAULT false,
      metadata JSONB NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  export const dropTable = "DROP TABLE notifications";

  export const migrate001 = `
    ALTER TABLE notifications
    ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT now()
  `;

  export const create = (id: string, userId: string, title: string, body: string, metadata: any) => {
    return {
      text: `
        INSERT INTO notifications (id, user_id, title, body, metadata)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id)
        DO UPDATE SET user_id=excluded.user_id, title=excluded.title, body=excluded.body, metadata=excluded.metadata
        RETURNING *
      `,
      values: [id, userId, title, body, metadata]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, user_id, created_at, title, body, acked, metadata
        FROM notifications
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const deleteById = (id: string, userId: string) => {
    return {
      text: `
        DELETE FROM notifications
        WHERE id = $1 AND user_id = $2
      `,
      values: [id, userId]
    };
  };

  export const ackById = (id: string, userId: string) => {
    return {
      text: `
        UPDATE notifications
        SET acked = true
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, created_at, title, body, acked, metadata
      `,
      values: [id, userId]
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

export const rollback = (pool: Pool): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const all = (pool: Pool) => (userId: string) : TE.TaskEither<Exception.t, Notification.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all(userId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Notification.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const deleteById = (pool: Pool) => (userId: string) => (id: string) : TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id, userId)),
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

export const ackById = (pool: Pool) => (userId: string) => (id: string) : TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.ackById(id, userId)),
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

export const create = (pool: Pool) => (notification: Notification.Frontend.Create.t) : TE.TaskEither<Exception.t, Notification.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(
            notification.id
          , notification.userId
          , notification.title
          , notification.body
          , notification.metadata
        )),
        (error) => {
          console.log(error)
          return E.toError(error);
        }
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Notification.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise)
  );
};
