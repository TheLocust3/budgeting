import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Template } from "../../model";
import { Db, Exception } from "../../magic";

namespace Query {
  export const createTable = `
    CREATE TABLE templates (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      account_id TEXT,
      user_id TEXT NOT NULL,
      template JSONB NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  export const dropTable = "DROP TABLE templates";

  export const create = (id: string, accountId: string, userId: string, template: any) => {
    return {
      text: `
        INSERT INTO templates (id, account_id, user_id, template)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET account_id=excluded.account_id, user_id=excluded.user_id, template=excluded.template
        RETURNING *
      `,
      values: [id, accountId, userId, template]
    };
  };

  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, account_id, user_id, template
        FROM templates
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byAccountId = (userId: string, accountId: string) => {
    return {
      text: `
        SELECT id, account_id, user_id, template
        FROM templates
        WHERE user_id = $1 AND account_id = $2
      `,
      values: [userId, accountId]
    };
  };

  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, account_id, user_id, template
        FROM templates
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    };
  };

  export const deleteById = (id: string, userId: string) => {
    return {
      text: `
        DELETE FROM templates
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

export const all = (pool: Pool) => (userId: string) : TE.TaskEither<Exception.t, Template.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all(userId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Template.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const byAccountId = (pool: Pool) => (userId: string) => (accountId: string) : TE.TaskEither<Exception.t, Template.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byAccountId(userId, accountId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Template.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.mapLeft(Exception.pgRaise)
  );
};

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Exception.t, O.Option<Template.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Template.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
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

export const create = (pool: Pool) => (template: Template.Frontend.Create.t) : TE.TaskEither<Exception.t, Template.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(
            template.id
          , template.accountId
          , template.userId
          , template.template
        )),
        (error) => {
          console.log(error)
          return E.toError(error);
        }
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Template.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
    , TE.mapLeft(Exception.pgRaise)
  );
};
