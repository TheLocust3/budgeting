import crypto from "crypto";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { PathReporter } from "io-ts/PathReporter";

import { Transaction } from "model";
import { TransactionFrontend } from "storage";
import { Message, Route } from "magic";

export const router = new Route.Router();

router
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Transaction.Channel.Query.Json)
      , TE.chain(({ userEmail }) => TransactionFrontend.all(userEmail))
      , TE.map((transactions) => { return { transactions: transactions }; })
      , Route.respondWith(context)(Transaction.Channel.Response.TransactionList.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        TE.Do
      , TE.bind("createTransaction", () => Route.parseBody(context)(Transaction.Channel.Request.Create.Json))
      , TE.bind("query", () => Route.parseQuery(context)(Transaction.Channel.Query.Json))
      , TE.bind("transaction", ({ createTransaction }) => {
          const capturedAt = O.map((capturedAt: number) => new Date(capturedAt))(createTransaction.capturedAt);
          return TE.of({ ...createTransaction, id: crypto.randomUUID(), authorizedAt: new Date(createTransaction.authorizedAt), capturedAt: capturedAt, custom: {} });
        })
      , TE.chain(({ query, transaction }) => TransactionFrontend.createAll(query.userEmail)([transaction]))
      , TE.map((transactions) => transactions[0])
      , Route.respondWith(context)(Transaction.Internal.Json)
    );
  });
