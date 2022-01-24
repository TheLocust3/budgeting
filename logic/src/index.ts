import crypto from "crypto";
import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";

import { router as userRouter } from "./route/users";
import { router as sourceRouter } from "./route/sources";

import { Reaper } from "magic";
import { User } from "model";

type State = {
  id: string;
  user: User.Internal.t;
}

type Context = {
  db: Pool;
}

const app = new Koa<State, Context>();
app.context.db = new Pool();

const router = new Router();

router.use("/users", userRouter.routes(), userRouter.allowedMethods());
router.use("/sources", sourceRouter.routes(), sourceRouter.allowedMethods());

app.use(async (ctx, next) => {
  const start = Date.now();

  ctx.state.id = crypto.randomUUID();
  console.log(`[${ctx.state.id}] ${ctx.method}: ${ctx.url}`)

  await next();

  const took = Date.now() - start;
  console.log(`[${ctx.state.id}] took ${took}ms`)
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3001);
console.log("Listening at localhost:3001");
