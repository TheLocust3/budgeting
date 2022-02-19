import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";

import { JWT } from "../util";

import { User } from "model";
import { UserFrontend } from "storage";
import { Exception, Message, Route } from "magic";

export const router = new Route.Router();

router
  .post("/login", (context) => {
    return pipe(
        Route.parseBody(context)(User.External.Request.Credentials.Json)
      , TE.chain(({ email, password }) => UserFrontend.login(context.request.app.locals.db)(email, password))
      , TE.map((user) => JWT.sign(user))
      , TE.map((token) => { return { token: token }; })
      , Route.respondWith(context)(User.External.Response.Token.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        Route.parseBody(context)(User.External.Request.Create.Json)
      , TE.map((createUser) => { return { ...createUser, role: User.DEFAULT_ROLE }; })
      , TE.chain(UserFrontend.create(context.request.app.locals.db))
      , Route.respondWith(context)(User.Internal.Json)
    );
  });
