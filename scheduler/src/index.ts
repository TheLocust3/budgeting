import crypto from "crypto";
import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { router as sourceRouter } from "./route/sources";

import { User } from "model";

type State = {
  id: string;
}

type Context = {
  db: Pool;
}

const app = new Koa<State, Context>();
app.context.db = new Pool();

const router = new Router();

router.use("/channel/sources", sourceRouter.routes(), sourceRouter.allowedMethods());

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

app.listen(3002);
console.log("Listening at localhost:3002");
