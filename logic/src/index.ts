import crypto from "crypto";
import Express from "express";
import { graphqlHTTP } from 'express-graphql';
import cors from "cors";
import cookieParser from "cookie-parser";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import { router as userRouter } from "./route/users";
import { router as adminRouter } from "./route/admin";
import Schema from './graphql/schema';
import * as Context from './graphql/context';
import { AuthenticationFor } from "./util";

import { Reaper } from "magic";
import { User } from "model";

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

app.use(cors());
app.use(cookieParser());
app.use(Express.json());

app.use("/users", userRouter.router);
app.use("/admin", adminRouter.router);

app.use(AuthenticationFor.user)
app.use(
    '/graphql'
  , graphqlHTTP((request, response) => ({
        schema: Schema
      , graphiql: true
      , context: Context.empty(request, response)
    }))
);

app.listen(3001);
console.log("Listening at localhost:3001");
