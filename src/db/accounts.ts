import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as iot from 'io-ts';

import * as Account from '../model/Account';
import { expectOne } from './util';

namespace Query {
  export const createTable = `
    CREATE TABLE accounts (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY(group_id) REFERENCES groups(id)
    )
  `;

  export const dropTable = `DROP TABLE accounts`

  export const create = (groupId: string, name: string) => {
    return {
      text: `
        INSERT INTO accounts (group_id, name)
        VALUES ($1, $2)
        RETURNING *
      `,
      values: [groupId, name]
    }
  }

  export const byGroupId = (groupId: string) => {
    return {
      text: `
        SELECT id, group_id, name
        FROM accounts
        WHERE group_id = $1
      `,
      values: [groupId]
    }
  }

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, group_id, name
        FROM accounts
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
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

export const byGroupId = (pool: Pool) => (groupId: string) : TE.TaskEither<Error, Account.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byGroupId(groupId)),
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
        () => pool.query(Query.create(account.groupId, account.name)),
        E.toError
      )
    , expectOne
    , TE.chain(res => TE.fromEither(Account.Database.from(res.rows[0])))
  );
}
