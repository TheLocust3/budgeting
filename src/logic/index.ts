import crypto from "crypto";
import Express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

import GraphqlEndpoint from "./graphql/index";
import ExternalEndpoint from "./external/index";
import AdminEndpoint from "./admin/index";
import { AuthenticationFor } from "./util";
import { router as rootRouter } from "./route/root";

import { Reaper, Plaid } from "../magic";
import { User } from "../model";

const app = Express();
app.locals.db = new Pool();
app.locals.plaidClient = Plaid.buildClient();

app.use(async (request, response, next) => {
  const start = Date.now();

  if (request.get("request-id")) {
    response.locals.id = request.get("request-id");
  } else {
    response.locals.id = crypto.randomUUID();
  }

  console.log(`[${response.locals.id}] ${request.method}: ${request.url}`)

  await next();

  const took = Date.now() - start;
  console.log(`[${response.locals.id}] took ${took}ms`)
});

app.use(cors());
app.use(cookieParser());
app.use(Express.json());

app.use("/", rootRouter.router);

app.use("/external/graphql", ExternalEndpoint);

app.use(AuthenticationFor.user)
app.use("/graphql", GraphqlEndpoint);

app.use(AuthenticationFor.admin)
app.use("/admin/graphql", AdminEndpoint);

const port = process.env.PORT ? process.env.PORT : 8080
app.listen(port);
console.log(`Listening at localhost:${port}`);
