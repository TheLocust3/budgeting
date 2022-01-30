import Koa from "koa";
import Router from "@koa/router";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";

import * as Exception from "./exception";
import * as Message from "./message";
import * as Format from "./format";

export const fromQuery = (value: string | string[] | undefined): E.Either<Exception.t, string> => {
  return pipe(
      value
    , iot.string.decode
    , E.mapLeft((_) => Exception.throwBadRequest)
  );
};

export const parseBody =
  (context: Koa.Context) =>
  <T>(formatter: Format.Formatter<T>): TE.TaskEither<Exception.t, T> => {
  return pipe(
      formatter.from(context.request.body)
    , TE.fromEither
  );
}

export const parseQuery =
  (context: Koa.Context) =>
  <T>(formatter: Format.Formatter<T>): TE.TaskEither<Exception.t, T> => {
  return pipe(
      context.query
    , formatter.from
    , TE.fromEither
  );    
}

export const respondWith =
  (context: Koa.Context) =>
  <T>(formatter: Format.Formatter<T>) =>
  (response: TE.TaskEither<Exception.t, T>): Promise<void> => {
  return pipe(
      response
    , TE.map((response) => formatter.to(response))
    , TE.match(
          Message.respondWithError(context)
        , (out: any) => {
            context.body = out;
          }
      )
  )();
}

export const respondWithOk =
  (context: Koa.Context) =>
  (response: TE.TaskEither<Exception.t, any>): Promise<void> => {
  return pipe(
      response
    , TE.match(
          Message.respondWithError(context)
        , (out: any) => {
            context.body = Message.ok;
          }
      )
  )();
}
