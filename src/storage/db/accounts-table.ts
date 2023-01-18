import { Pool } from "pg";
import { Logger } from "pino";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Account } from "../../model";
import { Db, Exception } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE accounts (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      parent_id TEXT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY(parent_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  export const migrate001 = `
    ALTER TABLE accounts
    ADD COLUMN metadata JSONB
  `;

  export const dropTable = "DROP TABLE accounts";

  export const create = (id: string, parentId: string | null, userId: string, name: string, metadata: any) => {
    return {
      text: `
        INSERT INTO accounts (id, parent_id, user_id, name, metadata)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id)
        DO UPDATE SET parent_id=excluded.parent_id, user_id=excluded.user_id, name=excluded.name, metadata=excluded.metadata
        RETURNING *
      `,
      values: [id, parentId, userId, name, metadata]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, parent_id, user_id, name, metadata
        FROM accounts
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, parent_id, user_id, name, metadata
        FROM accounts
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    };
  };

  export const childrenOf = (parent: string) => {
    return {
      text: `
        SELECT id
        FROM accounts
        WHERE parent_id = $1
      `,
      values: [parent]
    };
  };

  export const deleteById = (id: string, userId: string) => {
    return {
      text: `
        DELETE FROM accounts
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
  } catch (err) {
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
  } catch (err) {
    log.error(err);
    return false;
  }
};

export const all = (pool: Pool) => (userId: string) : TE.TaskEither<Exception.t, Account.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all(userId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Account.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Exception.t, O.Option<Account.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Account.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const childrenOf = (pool: Pool) => (parent: string) : TE.TaskEither<Exception.t, string[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.childrenOf(parent)),
        E.toError
      )
    , TE.map(res => pipe(
        res.rows
      , A.map(row => String(row.id))
    ))
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

export const create = (pool: Pool) => (account: Account.Frontend.Create.t) : TE.TaskEither<Exception.t, Account.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(
            account.id
          , pipe(account.parentId, O.match(() => null, (parentId) => parentId))
          , account.userId
          , account.name
          , account.metadata
        )),
        (error) => {
          console.log(error)
          return E.toError(error);
        }
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Account.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise)
  );
};
