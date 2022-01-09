import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as iot from 'io-ts';

import * as Rule from '../model/Rule';

namespace Query {
  export const createTable = `
    CREATE TABLE rules (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id TEXT NOT NULL,
      rule JSONB NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )
  `;

  export const dropTable = `DROP TABLE rules`

  export const create = (accountId: string, rule: any) => {
    return {
      text: `
        INSERT INTO rules (account_id, rule)
        VALUES ($1, $2)
        RETURNING *
      `,
      values: [accountId, rule]
    }
  }

  export const byAccountId = (accountId: string) => {
    return {
      text: `
        SELECT id, account_id, rule
        FROM rules
        WHERE account_id = $1
      `,
      values: [accountId]
    }
  }

    export const byId = (id: string) => {
    return {
      text: `
        SELECT id, account_id, rule
        FROM rules
        WHERE id = $1
        LIMIT 1
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

export const byAccountId = (pool: Pool) => (accountId: string) : TE.TaskEither<Error, Rule.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byAccountId(accountId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Rule.Database.lift)
        , A.sequence(E.Applicative)
      )))
  );
}

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<Rule.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Rule.Database.lift)
        , A.sequence(E.Applicative)
      )))
    , TE.map(rules => {
        if (rules.length == 1) {
          return O.some(rules[0])
        } else {
          return O.none;
        }
      })
  );
}

export const create = (pool: Pool) => (rule: Rule.Internal.t) : TE.TaskEither<Error, Rule.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(rule.accountId, rule.rule)),
        E.toError
      )
    , TE.chain(res => {
        if (res.rows.length < 1) {
          return TE.left(new Error("Empty response"));
        } else {
          return TE.right(res.rows);
        }
      })
    , TE.chain(row => TE.fromEither(Rule.Database.lift(row[0])))
  );
}
