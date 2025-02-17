import { Pool } from "pg";
import { Logger } from "pino";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Transaction } from "../../model";
import { Db, Exception } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE transactions (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      source_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      merchant_name TEXT NOT NULL,
      description TEXT NOT NULL,
      authorized_at TIMESTAMP NOT NULL,
      captured_at TIMESTAMP,
      metadata JSONB NOT NULL,
      FOREIGN KEY(source_id) REFERENCES sources(id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  export const migrate001 = `
    ALTER TABLE transactions
    DROP CONSTRAINT "transactions_source_id_fkey",
    ADD CONSTRAINT "transactions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES sources(id) ON DELETE CASCADE;
  `;

  export const dropTable = "DROP TABLE transactions";

  export const create = (
      id: string
    , sourceId: string
    , userId: string
    , amount: number
    , merchantName: string
    , description: string
    , authorizedAt: Date
    , capturedAt: Date | null
    , metadata: any
  ) => {
    return {
      text: `
        INSERT INTO transactions (id, source_id, user_id, amount, merchant_name, description, authorized_at, captured_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id)
        DO UPDATE SET amount=excluded.amount, merchant_name=excluded.merchant_name, description=excluded.description, captured_at=excluded.captured_at, metadata=excluded.metadata
        RETURNING *
      `,
      values: [id, sourceId, userId, amount, merchantName, description, authorizedAt, capturedAt, metadata]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, source_id, user_id, amount, merchant_name, description, authorized_at, captured_at, metadata
        FROM transactions
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, source_id, user_id, amount, merchant_name, description, authorized_at, captured_at, metadata
        FROM transactions
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    };
  };

  export const deleteById = (id: string, userId: string) => {
    return {
      text: `
        DELETE FROM transactions
        WHERE id = $1 AND user_id = $2
      `,
      values: [id, userId]
    };
  };
}

export const migrate = (pool: Pool) => (log: Logger): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.createTable);
    return true;
  } catch(err) {
    log.error(err);
    return false;
  }
};

export const migrate001 = (pool: Pool) => (log: Logger): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.migrate001);
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
  } catch(err) {
    log.error(err);
    return false;
  }
};

export const all = (pool: Pool) => (log: Logger) => (userId: string) : TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all(userId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Transaction.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const byId = (pool: Pool) => (log: Logger) => (id: string) : TE.TaskEither<Exception.t, O.Option<Transaction.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Transaction.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string) : TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id, userId)),
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

export const create = (pool: Pool) => (log: Logger) => (transaction: Transaction.Frontend.Create.t) : TE.TaskEither<Exception.t, Transaction.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(
            transaction.id
          , transaction.sourceId
          , transaction.userId
          , transaction.amount
          , transaction.merchantName
          , transaction.description
          , transaction.authorizedAt
          , pipe(transaction.capturedAt, O.match(() => null, (date) => date))
          , transaction.metadata
        )),
        (e) => {
          log.error(e)
          return E.toError(e)
        }
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Transaction.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};
