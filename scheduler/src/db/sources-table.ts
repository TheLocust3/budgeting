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

// TODO: JK could really slim this down
namespace Query {
  export const all = (userId: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id
        FROM sources
        WHERE user_id = $1
      `,
      values: [userId]
    };
  };

  export const byId = (userId: string, id: string) => {
    return {
      text: `
        SELECT id, user_id, name, integration_id
        FROM sources
        WHERE user_id = $1 AND id = $2
        LIMIT 1
      `,
      values: [userId, id]
    };
  };
}

export const all = (pool: Pool) => (userId: string) : TE.TaskEither<Error, Source.Internal.t[]> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.all(userId)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
  );
};

export const byId = (pool: Pool) => (userId: string) => (id: string) : TE.TaskEither<Error, O.Option<Source.Internal.t>> => {
  return pipe(
      TE.tryCatch(
        () => pool.query(Query.byId(userId, id)),
        E.toError
      )
    , TE.chain(res => TE.fromEither(pipe(
          res.rows
        , A.map(Source.Internal.Database.from)
        , A.map(E.mapLeft(E.toError))
        , A.sequence(E.Applicative)
      )))
    , TE.map(A.lookup(0))
  );
};
