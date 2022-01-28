import crypto from "crypto";
import Koa from "koa";
import Router from "@koa/router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import { router as userRouter } from "./route/users";
import { router as sourceRouter } from "./route/sources";
import { router as adminRouter } from "./route/admin";
import { router as plaidRouter } from "./route/plaid";

import { Reaper } from "magic";
import { User } from "model";

type State = {
  id: string;
  user: User.Internal.t;
}

type Context = {
  db: Pool;
  plaidClient: PlaidApi;
}

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET
    },
  },
});
const plaidClient = new PlaidApi(plaidConfig);

const app = new Koa<State, Context>();
app.context.db = new Pool();
app.context.plaidClient = plaidClient;

const router = new Router();

router.use("/users", userRouter.routes(), userRouter.allowedMethods());
router.use("/sources", sourceRouter.routes(), sourceRouter.allowedMethods());
router.use("/admin", adminRouter.routes(), adminRouter.allowedMethods());
router.use("/plaid", plaidRouter.routes(), plaidRouter.allowedMethods());

app.use(async (ctx, next) => {
  const start = Date.now();

  ctx.state.id = crypto.randomUUID();
  console.log(`[${ctx.state.id}] ${ctx.method}: ${ctx.url}`)

  await next();

  const took = Date.now() - start;
  console.log(`[${ctx.state.id}] took ${took}ms`)
});

app.use(cors());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3001);
console.log("Listening at localhost:3001");
