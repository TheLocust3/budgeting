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

router
  .post("/login", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , User.Frontend.Request.Credentials.Json.from
      , TE.fromEither
      , TE.chain(({ email, password }) => UserFrontend.login(ctx.db)(email, password))
      , TE.map(JWT.sign)
      , TE.map((token) => User.Frontend.Response.Token.Json.to({ token: token }))
      , TE.match(
            Message.respondWithError(ctx)
          , (token) => {
              ctx.body = token;
            }
        )
    )();
  })
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , User.Frontend.Request.Create.Json.from
      , E.map((createUser) => { return { ...createUser, id: "", role: User.DEFAULT_ROLE }; })
      , TE.fromEither
      , TE.chain(UserFrontend.create(ctx.db))
      , TE.map(User.Internal.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (user) => {
              ctx.body = user;
            }
        )
    )();
  });
