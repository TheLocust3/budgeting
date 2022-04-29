import crypto from "crypto";
import Express from "express";
import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import * as Reaper from "./reaper/index";
import { router as rootRouter } from "./route/root";

import { User } from "model";

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.development,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET
    },
  },
});
const plaidClient = new PlaidApi(plaidConfig);

const app = Express();
app.locals.db = new Pool();
app.locals.plaidClient = plaidClient;

app.use(async (request, response, next) => {
  const start = Date.now();

  response.locals.id = crypto.randomUUID();
  console.log(`[${response.locals.id}] ${request.method}: ${request.url}`)

  await next();

  const took = Date.now() - start;
  console.log(`[${response.locals.id}] took ${took}ms`)
});

app.use(Express.json());

app.use("/", rootRouter.router);

const port = process.env.PORT ? process.env.PORT : 8080
app.listen(port);
console.log(`Listening at localhost:${port}`);

Reaper.tick(app.locals.db)(app.locals.plaidClient);
