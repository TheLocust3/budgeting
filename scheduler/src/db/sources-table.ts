import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Source } from "model";
import { Db } from "magic";

namespace Query {
  const isExpired = `last_refreshed < now() - '10 minutes' :: interval AND integration_id IS NOT NULL`

  export const allExpired = `
    SELECT id, user_id, name, integration_id, created_at
    FROM sources
    WHERE ${isExpired}
  `;

  export const tryLockById = (id: string) => {
    return {
      text: `
        UPDATE sources
        SET last_refreshed = now()
        WHERE id = $1 AND (${isExpired})
        RETURNING *
      `,
      values: [id]
    };
  };
}

export const allExpired = (pool: Pool) => () : TE.TaskEither<Error, Source.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.allExpired),
        (e) => {
          console.log(e)
          throw e;
        }
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
  );
};

export const tryLockById = (pool: Pool) => (id: string) : TE.TaskEither<Error, boolean> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.tryLockById(id))
        , E.toError
      )
    , TE.map((res) => res.rows.length === 1) // if we managaed to update a single row, we've acquired the "lock"
  );
};
