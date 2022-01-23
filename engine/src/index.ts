import crypto from "crypto";
import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import { Pool } from "pg";

import { router as transactionsRouter } from "./route/transactions";
import { router as accountsRouter } from "./route/accounts";
import { router as rulesRouter } from "./route/rules";
import { router as pullerTransactionsRouter } from "./route/puller/transactions";

type State = {
  id: string;
};

type Context = {
  db: Pool;
}

const app = new Koa<State, Context>();
app.context.db = new Pool();

const router = new Router();

router.use("/channel/transactions", transactionsRouter.routes(), transactionsRouter.allowedMethods());
router.use("/channel/accounts", accountsRouter.routes(), accountsRouter.allowedMethods());
router.use("/channel/rules", rulesRouter.routes(), rulesRouter.allowedMethods());
router.use("/puller/transactions", pullerTransactionsRouter.routes(), pullerTransactionsRouter.allowedMethods());

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

app.listen(3000);
console.log("Listening at localhost:3000");
