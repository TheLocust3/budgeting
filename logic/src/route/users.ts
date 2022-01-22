import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";

import UserFrontend from "../frontend/user-frontend";
import { JWT } from "./util";

import { User } from "model";
import { Exception, Message } from "magic";

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
    };
  }
}

router
  .post("/login", async (ctx, next) => {
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
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , User.Json.from
      , TE.fromEither
      , TE.chain(UserFrontend.create(ctx.db))
      , TE.map(User.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (user) => {
              ctx.body = user;
            }
        )
    )();
  });
  /*.get('/', async (ctx, next) => {
    await pipe(
        UserFrontend.all(ctx.db)()
      , TE.map(A.map(User.Json.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (users) => {
              ctx.body = { users: users };
            }
        )
    )();
  })
  .get('/:userId', async (ctx, next) => {
    const userId = ctx.params.userId
    await pipe(
        userId
      , UserFrontend.getById(ctx.db)
      , TE.map(User.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (user) => {
              ctx.body = { user: user };
            }
        )
    )();
  })
  .delete('/:userId', async (ctx, next) => {
    const userId = ctx.params.userId
    await pipe(
        userId
      , UserFrontend.deleteById(ctx.db)
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  })*/
