import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { PathReporter } from "io-ts/PathReporter";

import TransactionFrontend from "../../frontend/transaction-frontend";

import { Transaction } from "model";
import { Message, Route } from "magic";

export const router = new Router();

router
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Transaction.Json.from
      , TE.fromEither
      , TE.chain(TransactionFrontend.create(ctx.db))
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  })
