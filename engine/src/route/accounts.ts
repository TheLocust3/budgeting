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

export const router = new Route.Router();

router
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userEmail }) => AccountFrontend.all(context.request.app.locals.db)(userEmail))
      , TE.map((accounts) => { return { accounts: accounts }; })
      , Route.respondWith(context)(Account.Channel.Response.AccountList.Json)
    );
  });

router
  .get("/:accountId", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userEmail }) => AccountFrontend.getByIdAndUserId(context.request.app.locals.db)(userEmail)(accountId))
      , Route.respondWith(context)(Account.Internal.Json)
    );
  })

router
  .get("/:accountId/materialize", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        TE.Do
      , TE.bind("query", () => Route.parseQuery(context)(Account.Channel.Query.Json))
      , TE.bind("account", ({ query }) => {
          return pipe(
              AccountFrontend.getByIdAndUserId(context.request.app.locals.db)(query.userEmail)(accountId)
            , TE.chain(AccountFrontend.withRules(context.request.app.locals.db))
            , TE.chain(AccountFrontend.withChildren(context.request.app.locals.db))
          );
        })
      , TE.chain(({ query, account }) => Materialize.execute(context.request.app.locals.id)(query.userEmail)(context.request.app.locals.db)(account))
      , Route.respondWith(context)(Materialize.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        Route.parseBody(context)(Account.Channel.Request.Create.Json)
      , TE.map((createAccount) => { return { ...createAccount, id: "", rules: [], children: [] } })
      , TE.chain(AccountFrontend.create(context.request.app.locals.db))
      , Route.respondWith(context)(Account.Internal.Json)
    );
  });

router
  .delete("/:accountId", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userEmail }) => AccountFrontend.deleteById(context.request.app.locals.db)(userEmail)(accountId))
      , Route.respondWithOk(context)
    );
  });
