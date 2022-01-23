import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { PathReporter } from "io-ts/PathReporter";

import TransactionFrontend from "../frontend/transaction-frontend";

import { Transaction } from "model";
import { Message } from "magic";

export const router = new Router();

router
  .get("/", async (ctx, next) => {
    await pipe(
        TransactionFrontend.all(ctx.db)()
      , TE.map(A.map(Transaction.Channel.Response.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (transactions) => {
              ctx.body = { transactions: transactions };
            }
        )
    )();
  })
  .get("/:transactionId", async (ctx, next) => {
    const transactionId = ctx.params.transactionId;
    await pipe(
        transactionId
      , TransactionFrontend.getById(ctx.db)
      , TE.map(Transaction.Channel.Response.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (transaction) => {
              ctx.body = { transaction: transaction };
            }
        )
    )();
  })
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Transaction.Channel.Request.from
      , TE.fromEither
      , TE.chain(TransactionFrontend.create(ctx.db))
      , TE.map(Transaction.Channel.Response.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (transaction) => {
              ctx.body = transaction;
            }
        )
    )();
  })
  .delete("/:transactionId", async (ctx, next) => {
    const transactionId = ctx.params.transactionId;
    await pipe(
        transactionId
      , TransactionFrontend.deleteById(ctx.db)
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  });

