import crypto from "crypto";
import Koa from "koa";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import { Pool } from "pg";

import { router as transactionsRouter } from "./route/transactions";
import { router as accountsRouter } from "./route/accounts";
import { router as rulesRouter } from "./route/rules";

type State = {
  id: string;
};

type Context = {
  db: Pool;
}

const app = new Koa<State, Context>();
app.context.db = new Pool();

const router = new Router();

router.use("/transactions", transactionsRouter.routes(), transactionsRouter.allowedMethods());
router.use("/accounts", accountsRouter.routes(), accountsRouter.allowedMethods());
router.use("/rules", rulesRouter.routes(), rulesRouter.allowedMethods());

app.use(async (ctx, next) => {
  const start = Date.now();

  ctx.state.id = crypto.randomUUID();
  console.log(`[${ctx.state.id}] ${ctx.url}`)

  await next();

  const took = Date.now() - start;
  console.log(`[${ctx.state.id}] took ${took}ms`)
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log("Listening at localhost:3000");
