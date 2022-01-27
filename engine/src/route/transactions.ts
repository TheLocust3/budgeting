import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { PathReporter } from "io-ts/PathReporter";

import TransactionFrontend from "../frontend/transaction-frontend";

import { Transaction } from "model";
import { Message, Route } from "magic";

export const router = new Router();

router
  .get("/", async (ctx, next) => {
    await pipe(
        ctx.query.userId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain(TransactionFrontend.all(ctx.db))
      , TE.map(A.map(Transaction.Internal.Json.to))
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
        ctx.query.userId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain((userId) => TransactionFrontend.getById(ctx.db)(userId)(transactionId))
      , TE.map(Transaction.Internal.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (transaction) => {
              ctx.body = transaction;
            }
        )
    )();
  })
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Transaction.Channel.Request.Create.Json.from
      , E.map((createTransaction) => {
          const capturedAt = O.map((capturedAt: number) => new Date(capturedAt))(createTransaction.capturedAt);
          return { ...createTransaction, id: "", authorizedAt: new Date(createTransaction.authorizedAt), capturedAt: capturedAt, custom: {} };
        })
      , TE.fromEither
      , TE.chain(TransactionFrontend.create(ctx.db))
      , TE.map(Transaction.Internal.Json.to)
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
        ctx.query.userId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain((userId) => TransactionFrontend.deleteById(ctx.db)(userId)(transactionId))
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  });

