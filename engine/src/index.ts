import crypto from "crypto";
import Express from "express";
import { Pool } from "pg";

import { router as transactionsRouter } from "./route/transactions";
import { router as accountsRouter } from "./route/accounts";
import { router as rulesRouter } from "./route/rules";

const app = Express();
app.locals.db = new Pool();

app.use((request, response, next) => {
  const start = Date.now();

  response.locals.id = crypto.randomUUID();
  console.log(`[${response.locals.id}] ${request.method}: ${request.url}`)

  next();

  const took = Date.now() - start;
  console.log(`[${response.locals.id}] took ${took}ms`)
});

app.use(Express.json());

app.use("/channel/transactions", transactionsRouter.router);
app.use("/channel/accounts", accountsRouter.router);
app.use("/channel/rules", rulesRouter.router);

app.listen(3000);
console.log("Listening at localhost:3000");
