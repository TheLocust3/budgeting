import crypto from "crypto";
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
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Transaction.Channel.Query.Json)
      , TE.chain(({ userId }) => TransactionFrontend.all(context.db)(userId))
      , TE.map((transactions) => { return { transactions: transactions }; })
      , Route.respondWith(context)(Transaction.Channel.Response.TransactionList.Json)
    );
  });

router
  .get("/:transactionId", (context) => {
    const transactionId = context.params.transactionId;

    return pipe(
        Route.parseQuery(context)(Transaction.Channel.Query.Json)
      , TE.chain(({ userId }) => TransactionFrontend.getById(context.db)(userId)(transactionId))
      , Route.respondWith(context)(Transaction.Internal.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        Route.parseBody(context)(Transaction.Channel.Request.Create.Json)
      , TE.map((createTransaction) => {
          const capturedAt = O.map((capturedAt: number) => new Date(capturedAt))(createTransaction.capturedAt);
          return { ...createTransaction, id: crypto.randomUUID(), authorizedAt: new Date(createTransaction.authorizedAt), capturedAt: capturedAt, custom: {} };
        })
      , TE.chain(TransactionFrontend.create(context.db))
      , Route.respondWith(context)(Transaction.Internal.Json)
    );
  });

router
  .delete("/:transactionId", (context) => {
    const transactionId = context.params.transactionId;

    return pipe(
        Route.parseQuery(context)(Transaction.Channel.Query.Json)
      , TE.chain(({ userId }) => TransactionFrontend.deleteById(context.db)(userId)(transactionId))
      , Route.respondWithOk(context)
    );
  });

