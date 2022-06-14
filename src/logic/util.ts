import Express from "express";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";

import { User } from "../model";
import { UserFrontend } from "../storage";
import { Exception, Message, Route } from "../magic";

export namespace AuthenticationFor {
  const tryHeader = (request: Express.Request): TE.TaskEither<Exception.t, User.Internal.t> => {
    return JWT.verify(request.app.locals.db)(String(request.header("Authorization")));
  }

  const tryCookie = (request: Express.Request): TE.TaskEither<Exception.t, User.Internal.t> => {
    return JWT.verify(request.app.locals.db)(String(request.cookies["auth-token"]));
  }

  export const user = async (request: Express.Request, response: Express.Response, next: Express.NextFunction) => {
    await pipe(
        tryHeader(request)
      , TE.orElse(() => tryCookie(request))
      , TE.match(
          () => {
            response.locals.user = undefined;
            next();
          }
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

export namespace JWT {
  namespace Payload {
    export const t = iot.type({
      userId: iot.string
    });
    export type t = iot.TypeOf<typeof t>

    export const from = (request: any): E.Either<Exception.t, t> => {
      return pipe(
          request
        , t.decode
        , E.mapLeft((_) => Exception.throwMalformedJson)
      );
    };
  }

  export const sign = (user: User.Internal.t): string => {
    const payload: Payload.t = { userId: user.id };
    return jwt.sign(payload, "secret"); // TODO: JK
  };

  export const verify = (pool: Pool) => (token: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    if (token !== undefined && token !== null && token !== "") {
      return pipe(
          E.tryCatch(
              () => jwt.verify(token, "secret") // TODO JK
            , () => Exception.throwUnauthorized
          )
        , E.chain(Payload.from)
        , TE.fromEither
        , TE.chain(({ userId }) => UserFrontend.getById(pool)(userId))
        , TE.mapLeft((_) => Exception.throwUnauthorized)
      );
    } else {
      return TE.throwError(Exception.throwUnauthorized);
    }
  };
}