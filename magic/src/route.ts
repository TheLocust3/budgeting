import Express from "express";
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

type Context = {
  request: Express.Request;
  query: any;
  body: any;
  status: number;
}

type Handler = (context: Context) => Promise<void>;

// provide some basic Koa interop to make my life easier
export class Router {
  private router = Express.Router();

  public use = (handler: Express.RequestHandler) => {
    this.router.use(handler);
  }

  public get = (route: string, handler: Handler) => {
    this.router.get(route, this.handleRoute(handler));
  }

  public post = (route: string, handler: Handler) => {
    this.router.post(route, this.handleRoute(handler));
  }

  public delete = (route: string, handler: Handler) => {
    this.router.delete(route, this.handleRoute(handler));
  }

  private handleRoute = (handler: Handler) => {
    return async (request: Express.Request, response: Express.Response) => {
      const context: Context = { request: request, query: request.query, body: "", status: 200 };
      await handler(context);
      response.sendStatus(context.status);
      response.json(context.body);
    }
  }
}

export const fromQuery = (value: string | string[] | undefined): E.Either<Exception.t, string> => {
  return pipe(
      value
    , iot.string.decode
    , E.mapLeft((_) => Exception.throwBadRequest)
  );
};

export const parseBody =
  (context: Context) =>
  <T>(formatter: Format.Formatter<T>): TE.TaskEither<Exception.t, T> => {
  return pipe(
      formatter.from(context.request.body)
    , TE.fromEither
  );
}

export const parseQuery =
  (context: Context) =>
  <T>(formatter: Format.Formatter<T>): TE.TaskEither<Exception.t, T> => {
  return pipe(
      context.query
    , formatter.from
    , TE.fromEither
  );    
}

export const respondWith =
  (context: Context) =>
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
  (context: Context) =>
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
