import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import AccountFrontend from "../frontend/account-frontend";

import { Account } from "model";
import { Transaction } from "model";
import { Rule } from "model";
import * as Materialize from "../materialize/index";
import { Message, Route } from "magic";

export const router = new Router();

router
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userId }) => AccountFrontend.all(context.db)(userId))
      , TE.map((accounts) => { return { accounts: accounts }; })
      , Route.respondWith(context)(Account.Channel.Response.AccountList.Json)
    );
  });

router
  .get("/:accountId", (context) => {
    const accountId = context.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userId }) => AccountFrontend.getByIdAndUserId(context.db)(userId)(accountId))
      , Route.respondWith(context)(Account.Internal.Json)
    );
  })

router
  .get("/:accountId/materialize", (context) => {
    const accountId = context.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userId }) => AccountFrontend.getByIdAndUserId(context.db)(userId)(accountId))
      , TE.chain(AccountFrontend.withRules(context.db))
      , TE.chain(AccountFrontend.withChildren(context.db))
      , TE.chain((account) => Materialize.execute(context.state.id)(context.db)(account))
      , Route.respondWith(context)(Materialize.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        Route.parseBody(context)(Account.Channel.Request.Create.Json)
      , TE.map((createAccount) => { return { ...createAccount, id: "", rules: [], children: [] } })
      , TE.chain(AccountFrontend.create(context.db))
      , Route.respondWith(context)(Account.Internal.Json)
    );
  });

router
  .delete("/:accountId", (context) => {
    const accountId = context.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userId }) => AccountFrontend.deleteById(context.db)(userId)(accountId))
      , Route.respondWithOk(context)
    );
  });
