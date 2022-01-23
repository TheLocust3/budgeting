import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Rule } from "model";
import { Db } from "magic";

namespace Query {
  export const createTable = `
    CREATE TABLE rules (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id TEXT NOT NULL,
      rule JSONB NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )
  `;

  export const dropTable = "DROP TABLE rules";

  export const create = (accountId: string, rule: any) => {
    return {
      text: `
        INSERT INTO rules (account_id, rule)
        VALUES ($1, $2)
        RETURNING *
      `,
      values: [accountId, rule]
    };
  };

  export const byAccountId = (accountId: string) => {
    return {
      text: `
        SELECT id, account_id, rule
        FROM rules
        WHERE account_id = $1
      `,
      values: [accountId]
    };
  };

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, account_id, rule
        FROM rules
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    };
  };

  export const deleteById = (id: string, accountId: string) => {
    return {
      text: `
        DELETE FROM rules
        WHERE id = $1 AND account_id = $2
      `,
      values: [id, accountId]
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

export const byAccountId = (pool: Pool) => (accountId: string) : TE.TaskEither<Error, Rule.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byAccountId(accountId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Rule.Database.from)
        , A.sequence(E.Applicative)
      )))
  );
};

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<Rule.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Rule.Database.from)
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
  );
};

export const deleteById = (pool: Pool) => (accountId: string) => (id: string) : TE.TaskEither<Error, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id, accountId)),
        E.toError
      )
    , TE.map(x => { return; })
  );
};

export const create = (pool: Pool) => (rule: Rule.Internal.t) : TE.TaskEither<Error, Rule.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(rule.accountId, rule.rule)),
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => TE.fromEither(Rule.Database.from(res.rows[0])))
  );
};
