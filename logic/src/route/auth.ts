import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import * as iot from 'io-ts';

import UserFrontend from '../frontend/user-frontend';
import { JWT } from './util';

import { User } from 'model';
import { Message } from 'magic';
import { Exception } from 'magic';

export const router = new Router();

namespace Requests {
  export namespace Login {
    const t = iot.type({
        email: iot.string
      , password: iot.string
    });
    type t = iot.TypeOf<typeof t>

    export const from = (request: any): E.Either<Exception.t, t> => {
      return pipe(
          request
        , t.decode
        , E.mapLeft((_) => Exception.throwMalformedJson)
      );
    }
  }
}

router
  .post('/login', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Requests.Login.from
      , TE.fromEither
      , TE.chain(({ email, password }) => UserFrontend.login(ctx.db)(email, password))
      , TE.map(JWT.sign)
      , TE.match(
            Message.respondWithError(ctx)
          , (token) => {
              ctx.body = { token: token };
            }
        )
    )();
  })
