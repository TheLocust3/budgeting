import Express from "express";
import { Pool } from "pg";
import { Logger } from "pino";
import fetch from "node-fetch";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";
import { Auth } from "firebase-admin/auth";

import { User } from "../model";
import { UserResource } from "../user";
import { UserFrontend } from "../storage";
import { Exception, Message, Route, Pipe } from "../magic";

export namespace AuthenticationFor {
  const tryHeader = (request: Express.Request): TE.TaskEither<Exception.t, User.Internal.t> => {
    return Central.verify(request.app.locals.db)(request.log)(String(request.header("Authorization")));
  }

  const tryCookie = (request: Express.Request): TE.TaskEither<Exception.t, User.Internal.t> => {
    return Central.verify(request.app.locals.db)(request.log)(String(request.cookies["auth-token"]));
  }

  export const user = async (request: Express.Request, response: Express.Response, next: Express.NextFunction) => {
    await pipe(
        tryHeader(request)
      , TE.orElse(() => tryCookie(request))
      , TE.match(
          Message.respondWithError({ request, response })
        , async (user) => {
            response.locals.user = user;
            next();
          }
      )
    )();
  };

  export const admin = async (request: Express.Request, response: Express.Response, next: Express.NextFunction) => {
    await pipe(
        tryHeader(request)
      , TE.orElse(() => tryCookie(request))
      , TE.chain((user: User.Internal.t) => {
          if (user.role === 'superuser') {
            return <TE.TaskEither<Exception.t, User.Internal.t>>TE.of(user);
          } else {
            return <TE.TaskEither<Exception.t, User.Internal.t>>TE.throwError(Exception.throwUnauthorized);
          }
        })
      , TE.match(
          Message.respondWithError({ request, response })
        , async (user: User.Internal.t) => {
            response.locals.user = user;
            next();
          }
      )
    )();
  };
}

export namespace Firebase {
  export const verify = (pool: Pool) => (log : Logger) => (auth: Auth) => (token: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    if (token !== undefined && token !== null && token !== "") {
      return pipe(
          Pipe.fromPromise(log)(auth.verifyIdToken(token))
        , TE.chain((decoded) => {
            var email = ""
            if (decoded.email !== undefined && decoded.email !== null) {
              email = decoded.email
            }

            return UserResource.getOrCreate(pool)(log)({ id: decoded.uid, email: email });
          })
        , TE.mapLeft(() => Exception.throwUnauthorized)
      );
    } else {
      return TE.throwError(Exception.throwUnauthorized);
    }
  }
}

export namespace Central {
  const host = process.env.CENTRAL_BASE ? process.env.CENTRAL_BASE : "http://central-server:8080/api"

  const validate = (pool: Pool) => (log : Logger) => (token: string): TE.TaskEither<Exception.t, { id: string, email: string}> => {
    return pipe(
        Pipe.fromPromise(log)(fetch(`${host}/users/validate`, { method: "POST", body: JSON.stringify({ token }) }))
      , TE.chain((response) => Pipe.fromPromise(log)(response.json()))
      , TE.chain(({ user }) => {
          if (user === undefined) {
            return TE.throwError(Exception.throwUnauthorized);
          } else {
            return TE.of({ id: user.id, email: user.email });
          }
        })
    );
  }

  export const verify = (pool: Pool) => (log : Logger) => (token: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    if (token !== undefined && token !== null && token !== "") {
      return pipe(
          token
        , validate(pool)(log)
        , TE.chain(({ id, email }) => UserResource.getOrCreate(pool)(log)({ id: id, email: email }))
        , TE.mapLeft(() => Exception.throwUnauthorized)
      );
    } else {
      return TE.throwError(Exception.throwUnauthorized);
    }
  }
}
