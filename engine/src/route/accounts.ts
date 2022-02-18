import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Materialize from "../materialize/index";

import { Account, Transaction, Rule, Materialize as MaterializeModel } from "model";
import { AccountFrontend } from "storage";
import { Message, Route } from "magic";

export const router = new Route.Router();

router
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userId }) => AccountFrontend.all(context.request.app.locals.db)(userId))
      , TE.map((accounts) => { return { accounts: accounts }; })
      , Route.respondWith(context)(Account.Channel.Response.AccountList.Json)
    );
  });

router
  .get("/:accountId", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userId }) => AccountFrontend.getByIdAndUserId(context.request.app.locals.db)(userId)(accountId))
      , Route.respondWith(context)(Account.Internal.Json)
    );
  })

router
  .get("/:accountId/materialize", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userId }) => AccountFrontend.getByIdAndUserId(context.request.app.locals.db)(userId)(accountId))
      , TE.chain(AccountFrontend.withRules(context.request.app.locals.db))
      , TE.chain(AccountFrontend.withChildren(context.request.app.locals.db))
      , TE.chain((account) => Materialize.execute(context.response.locals.id)(context.request.app.locals.db)(account))
      , Route.respondWith(context)(MaterializeModel.Internal.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        Route.parseBody(context)(Account.Frontend.Create.Json)
      , TE.chain(AccountFrontend.create(context.request.app.locals.db))
      , Route.respondWith(context)(Account.Internal.Json)
    );
  });

router
  .delete("/:accountId", (context) => {
    const accountId = context.request.params.accountId;

    return pipe(
        Route.parseQuery(context)(Account.Channel.Query.Json)
      , TE.chain(({ userId }) => AccountFrontend.deleteById(context.request.app.locals.db)(userId)(accountId))
      , Route.respondWithOk(context)
    );
  });
