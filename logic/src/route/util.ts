import Koa from 'koa';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import * as iot from 'io-ts';

import UserFrontend from '../frontend/user-frontend';

import { User } from 'model';
import { Exception, Message } from 'magic';

export namespace AuthenticationFor {
  export const user = async (ctx: Koa.Context, next: Koa.Next) => {
    await pipe(
        ctx.get('Authorization')
      , JWT.verify(ctx.db)
      , TE.match(
          Message.respondWithError(ctx)
        , async (user) => {
            ctx.state.user = user;
            await next();
          }
      )
    )();
  }
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
    }
  }

  export const sign = (user: User.Internal.t): string => {
    const payload: Payload.t = { userId: user.id };
    return jwt.sign(payload, 'secret'); // TODO: JK
  }

  export const verify = (pool: Pool) => (token: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    if (token !== undefined && token !== null && token !== "") {
      return pipe(
          jwt.verify(token, 'secret') // TODO JK
        , Payload.from
        , TE.fromEither
        , TE.chain(({ userId }) => UserFrontend.getById(pool)(userId))
      );
    } else {
      return TE.throwError(Exception.throwUnauthorized)
    }
  }
}