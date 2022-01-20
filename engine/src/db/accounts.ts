import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as iot from 'io-ts';

import { Account } from 'model';
import { Db } from 'magic';

namespace Query {
  export const createTable = `
    CREATE TABLE accounts (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id TEXT,
      name TEXT NOT NULL,
      FOREIGN KEY(parent_id) REFERENCES accounts(id)
    )
  `;

  export const dropTable = `DROP TABLE accounts`

  export const create = (parentId: string | null, name: string) => {
    return {
      text: `
        INSERT INTO accounts (parent_id, name)
        VALUES ($1, $2)
        RETURNING *
      `,
      values: [parentId, name]
    }
  }

  export const all = `
    SELECT id, parent_id, name
    FROM accounts
  `

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, parent_id, name
        FROM accounts
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    }
  }

  export const childrenOf = (parent: string) => {
    return {
      text: `
        SELECT id
        FROM accounts
        WHERE parent_id = $1
      `,
      values: [parent]
    }
  }

  export const deleteById = (id: string) => {
    return {
      text: `
        DELETE FROM accounts
        WHERE id = $1
      `,
      values: [id]
    }
  }
}

export const migrate = (pool: Pool): T.Task<Boolean> => async () => {
  try {
    await pool.query(Query.createTable);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const rollback = (pool: Pool): T.Task<Boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const all = (pool: Pool) => () : TE.TaskEither<Error, Account.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Account.Database.from)
        , A.sequence(E.Applicative)
      )))
  );
}

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<Account.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Account.Database.from)
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
  );
}

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
}

export const deleteById = (pool: Pool) => (id: string) : TE.TaskEither<Error, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id)),
        E.toError
      )
    , TE.map(x => { return })
  );
}

export const create = (pool: Pool) => (account: Account.Internal.t) : TE.TaskEither<Error, Account.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(
            pipe(account.parentId, O.match(() => null, (parentId) => parentId))
          , account.name
        )),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => TE.fromEither(Account.Database.from(res.rows[0])))
  );
}
