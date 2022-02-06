import crypto from "crypto";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Materialize from "../materialize/index";

import { Account, Transaction, Rule } from "model";
import { AccountFrontend } from "storage";
import { Message, Route } from "magic";

export const router = new Route.Router();

router
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.ByEmail.Json)
      , TE.chain(({ userEmail }) => AccountFrontend.allByUser(userEmail))
      , TE.map((accounts) => { return { accounts: accounts }; })
      , Route.respondWith(context)(Account.Channel.Response.AccountList.Json)
    );
  });

router
  .get("/:accountId", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.ByEmail.Json)
      , TE.chain(({ userEmail }) => AccountFrontend.getById(userEmail)(accountId))
      , Route.respondWith(context)(Account.Internal.Json)
    );
  })

router
  .get("/:accountId/materialize", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        TE.Do
      , TE.bind("query", () => Route.parseQuery(context)(Account.Channel.Query.ByEmail.Json))
      , TE.bind("accounts", ({ query }) => AccountFrontend.allByUser(query.userEmail))
      , TE.chain(({ query, accounts }) => Materialize.execute(context.request.app.locals.id)(query.userEmail)(accountId)(accounts))
      , Route.respondWith(context)(Materialize.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        TE.Do
      , TE.bind("query", () => Route.parseQuery(context)(Account.Channel.Query.ByParent.Json))
      , TE.bind("createAccount", () => Route.parseBody(context)(Account.Channel.Request.Create.Json))
      , TE.bind("account", ({ createAccount }) => { return TE.of({ ...createAccount, id: crypto.randomUUID(), rules: [], children: [] }); })
      , TE.chain(({ query, account}) => AccountFrontend.create(query.userEmail)(query.parentId)(account))
      , Route.respondWith(context)(Account.Internal.Json)
    );
  });

router
  .delete("/:accountId", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.ByEmail.Json)
      , TE.chain(({ userEmail }) => AccountFrontend.deleteById(userEmail)(accountId))
      , Route.respondWithOk(context)
    );
  });
