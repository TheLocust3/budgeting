import { Pool } from "pg";
import { Logger } from "pino";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Rule } from "../../model";
import { Db, Exception } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE rules (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rule JSONB NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  export const dropTable = "DROP TABLE rules";

  export const create = (id: string, accountId: string, userId: string, rule: any) => {
    return {
      text: `
        INSERT INTO rules (id, account_id, user_id, rule)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET account_id=excluded.account_id, user_id=excluded.user_id, rule=excluded.rule
        RETURNING *
      `,
      values: [id, accountId, userId, rule]
    };
  };

  export const byAccountId = (accountId: string, userId: string) => {
    return {
      text: `
        SELECT id, account_id, user_id, rule
        FROM rules
        WHERE account_id = $1 and user_id = $2
      `,
      values: [accountId, userId]
    };
  };

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, account_id, user_id, rule
        FROM rules
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    };
  };

  export const deleteById = (id: string, accountId: string, userId: string) => {
    return {
      text: `
        DELETE FROM rules
        WHERE id = $1 AND account_id = $2 AND user_id = $3
      `,
      values: [id, accountId, userId]
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

export const rollback = (pool: Pool) => (log: Logger): T.Task<boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch (err) {
    log.error(err);
    return false;
  }
};

export const byAccountId = (pool: Pool) => (log: Logger) => (userId: string) => (accountId: string) : TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byAccountId(accountId, userId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Rule.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const byId = (pool: Pool) => (log: Logger) => (id: string) : TE.TaskEither<Exception.t, O.Option<Rule.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Rule.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};

export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (accountId: string) => (id: string) : TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.deleteById(id, accountId, userId)),
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

export const create = (pool: Pool) => (log: Logger) => (rule: Rule.Frontend.Create.t) : TE.TaskEither<Exception.t, Rule.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(rule.id, rule.accountId, rule.userId, rule.rule)),
        (error) => {
          log.error(error)
          return E.toError(error);
        }
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Rule.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise(log))
  );
};
