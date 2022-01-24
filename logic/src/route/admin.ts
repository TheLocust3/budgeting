import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";

import UserFrontend from "../frontend/user-frontend";
import { AuthenticationFor } from "./util";

import { User } from "model";
import { Exception, Reaper, Message } from "magic";

export const router = new Router();

router
  .use(AuthenticationFor.admin)
  .get('/', async (ctx, next) => {
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
    Reaper.enqueue((id) => {
      console.log(`DeleteUser[${id}] user ${userId}`);

      // TODO: JK delete all user resources
      return pipe(
          userId
        , UserFrontend.deleteById(ctx.db)
        , TE.match(
              (error) => {
                console.log(`DeleteUser[${id}] failed with ${error}`)
                return false
              }
            , () => {
                console.log(`DeleteUser[${id}] complete`)
                return true;
              }
          )
      );
    });

    console.log("TESTEST")
    ctx.body = Message.ok;
  });
