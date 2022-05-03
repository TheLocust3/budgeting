import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Account } from "../../model";
import { Db } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE accounts (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id TEXT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY(parent_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `;

  export const dropTable = "DROP TABLE accounts";

  export const create = (parentId: string | null, userId: string, name: string) => {
    return {
      text: `
        INSERT INTO accounts (parent_id, user_id, name)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      values: [parentId, userId, name]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, parent_id, user_id, name
        FROM accounts
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, parent_id, user_id, name
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

export const all = (pool: Pool) => (userId: string) : TE.TaskEither<Error, Account.Internal.t[]> => {
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
  );
};

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<Account.Internal.t>> => {
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
  );
};

export const childrenOf = (pool: Pool) => (parent: string) : TE.TaskEither<Error, string[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.childrenOf(parent)),
        E.toError
      )
    , TE.map(res => pipe(
        res.rows
      , A.map(row => String(row.id))
    ))
  );
};

export const deleteById = (pool: Pool) => (userId: string) => (id: string) : TE.TaskEither<Error, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id, userId)),
        E.toError
      )
    , TE.map(x => { return; })
  );
};

export const create = (pool: Pool) => (account: Account.Frontend.Create.t) : TE.TaskEither<Error, Account.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(
            pipe(account.parentId, O.match(() => null, (parentId) => parentId))
          , account.userId
          , account.name
        )),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Account.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
  );
};
