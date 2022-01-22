import fetch, { Response } from "node-fetch";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Exception, Message } from "magic";

export namespace SchedulerChannel {
  const host = "localhost" // TODO: JK
  const port = "3002" // TODO: JK

  export const push = (uri: string) => (method: string) => (body: O.Option<any> = O.none): TE.TaskEither<Exception.t, any> => {
    const resolved = O.match(
      () => { return {}; },
      (body) => { return { body: JSON.stringify(body) }; }
    )(body);

    return pipe(
        TE.tryCatch(
            () => fetch(
                `http://${host}:${port}${uri}`
              , { method: method, ...resolved, headers: { "Content-Type": "application/json" } }
            )
          , E.toError
        )
      , TE.chain((response) => {
          return TE.tryCatch(
              () => response.json()
            , E.toError
          );
        })
      , TE.mapLeft((_) => Exception.throwInternalError)
      , TE.chain((response) => pipe(response, Message.liftError, TE.fromEither))
    );
  };
}

export default SchedulerChannel;
