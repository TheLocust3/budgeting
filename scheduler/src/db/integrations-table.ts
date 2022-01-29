import { Pool } from "pg";
import { pipe } from "fp-ts/lib/function";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import * as iot from "io-ts";

import { Integration } from "model";
import { Db } from "magic";

namespace Query {
  export const byId = (id: string) => {
    return {
      text: `
        SELECT id, user_id, name, credentials
        FROM integrations
        WHERE id = $1
        LIMIT 1
      `,
      values: [id]
    };
  };
}

export const byId = (pool: Pool) => (id: string) : TE.TaskEither<Error, O.Option<Integration.Internal.t>> => {
  return pipe(
      TE.tryCatch(
          () => pool.query(Query.byId(id))
        , E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Integration.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
  );
};
