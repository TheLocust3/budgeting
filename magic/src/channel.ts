import fetch, { Response } from "node-fetch";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Exception from "./exception";
import * as Message from "./message";

export const push =
  (host: string) =>
  (port: string) =>
  (uri: string) =>
  (method: string) =>
  (body: O.Option<any> = O.none): TE.TaskEither<Exception.t, any> => {
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

export const toVoid = (task: TE.TaskEither<Exception.t, any>): TE.TaskEither<Exception.t, void> =>
  TE.map((_) => { return; })(task)

export const to = <T>(from: (response: any) => E.Either<Exception.t, T>) => (task: TE.TaskEither<Exception.t, any>): TE.TaskEither<Exception.t, T> => {
  return TE.chain((response: any) => pipe(response, from, TE.fromEither))(task)
}

export const toArrayOf = <T>(from: (response: any) => E.Either<Exception.t, T>) => (task: TE.TaskEither<Exception.t, any>): TE.TaskEither<Exception.t, T[]> => {
  return TE.chain((response: any) => TE.fromEither(pipe(
      response
    , A.map(from)
    , A.sequence(E.Applicative)
  )))(task);
}