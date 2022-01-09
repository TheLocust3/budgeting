import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/function';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as iot from 'io-ts';

import * as Transaction from '../model/Transaction';

namespace Query {
  export const createTable = `
    CREATE TABLE transactions (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      merchant_name TEXT NOT NULL,
      description TEXT NOT NULL,
      authorized_at DATE NOT NULL,
      captured_at DATE,
      metadata JSONB NOT NULL
    )
  `;

  export const dropTable = `DROP TABLE transactions`

  export const create = (
      sourceId: string
    , amount: number
    , merchantName: string
    , description: string
    , authorizedAt: Date
    , capturedAt: Date | null
    , metadata: any
  ) => {
    return {
      text: `
        INSERT INTO transactions (source_id, amount, merchant_name, description, authorized_at, captured_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      values: [sourceId, amount, merchantName, description, authorizedAt, capturedAt, metadata]
    }
  }

  export const all = `
    SELECT id, source_id, amount, merchant_name, description, authorized_at, captured_at, metadata
    FROM transactions
  `;

    export const byId = (id: string) => {
    return {
      text: `
        SELECT id, source_id, amount, merchant_name, description, authorized_at, captured_at, metadata
        FROM transactions
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
  } catch(err) {
    console.log(err);
    return false;
  }
}

export const rollback = (pool: Pool): T.Task<Boolean> => async () => {
  try {
    await pool.query(Query.dropTable);
    return true;
  } catch(err) {
    console.log(err);
    return false;
  }
}

export const all = (pool: Pool) => () : TE.TaskEither<Error, Transaction.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Transaction.Database.lift)
        , A.sequence(E.Applicative)
      )))
  );
}

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<Transaction.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Transaction.Database.lift)
        , A.sequence(E.Applicative)
      )))
    , TE.map(transactions => {
        if (transactions.length == 1) {
          return O.some(transactions[0])
        } else {
          return O.none;
        }
      })
  );
}

export const create = (pool: Pool) => (transaction: Transaction.Internal.t) : TE.TaskEither<Error, Transaction.Internal.t> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.create(
            transaction.sourceId
          , transaction.amount
          , transaction.merchantName
          , transaction.description
          , transaction.authorizedAt
          , pipe(transaction.capturedAt, O.match(() => null, (date) => date))
          , transaction.metadata
        )),
        E.toError
      )
    , TE.chain(res => {
        if (res.rows.length < 1) {
          return TE.left(new Error("Empty response"));
        } else {
          return TE.right(res.rows);
        }
      })
    , TE.chain(row => TE.fromEither(Transaction.Database.lift(row[0])))
  );
}
