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
import { Exception, Message, Route } from "magic";

export const router = new Router();

router
  .post("/login", (context) => {
    return pipe(
        Route.parseBody(context)(User.Frontend.Request.Credentials.Json)
      , TE.chain(({ email, password }) => UserFrontend.login(context.db)(email, password))
      , TE.map((user) => JWT.sign(user))
      , TE.map((token) => { return { token: token }; })
      , Route.respondWith(context)(User.Frontend.Response.Token.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        Route.parseBody(context)(User.Frontend.Request.Create.Json)
      , TE.map((createUser) => { return { ...createUser, id: "", role: User.DEFAULT_ROLE }; })
      , TE.chain(UserFrontend.create(context.db))
      , Route.respondWith(context)(User.Internal.Json)
    );
  });
