import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Transaction } from "model";
import { Db } from "magic";

namespace Query {
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
        DO UPDATE SET amount=excluded.amount, merchant_name=excluded.merchant_name, description=excluded.description, authorized_at=excluded.authorized_at, captured_at=excluded.captured_at, metadata=excluded.metadata
        RETURNING *
      `,
      values: [id, sourceId, userId, amount, merchantName, description, authorizedAt, capturedAt, metadata]
    };
  };
}

export const create = (pool: Pool) => (transaction: Transaction.Internal.t) : TE.TaskEither<Error, Transaction.Internal.t> => {
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
        E.toError
      )
    , Db.expectOne
    , TE.chain(res => pipe(res.rows[0], Transaction.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither))
  );
};
