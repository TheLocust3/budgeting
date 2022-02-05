import Express from "express";
import jwt from "jsonwebtoken";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";

import { User } from "model";
import { UserFrontend } from "storage";
import { Exception, Message, Route } from "magic";

export namespace AuthenticationFor {
  export const user = async (request: Express.Request, response: Express.Response, next: Express.NextFunction) => {
    await pipe(
        String(request.header("Authorization"))
      , JWT.verify
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
        String(request.header("Authorization"))
      , JWT.verify
      , TE.chain((user) => {
          if (user.role === 'superuser') {
            return TE.of(user);
          } else {
            return TE.throwError(Exception.throwUnauthorized);
          }
        })
      , TE.match(
          Message.respondWithError({ request, response })
        , async (user) => {
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
      userEmail: iot.string
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
    const payload: Payload.t = { userEmail: user.email };
    return jwt.sign(payload, "secret"); // TODO: JK
  };

  export const verify = (token: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    if (token !== undefined && token !== null && token !== "") {
      return pipe(
          jwt.verify(token, "secret") // TODO JK
        , Payload.from
        , TE.fromEither
        , TE.chain(({ userEmail }) => UserFrontend.getByEmail(userEmail))
      );
    } else {
      return TE.throwError(Exception.throwUnauthorized);
    }
  };
}