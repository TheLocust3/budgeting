import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { PathReporter } from "io-ts/PathReporter";

import RuleFrontend from "../frontend/rule-frontend";

import { Rule } from "model";
import { Message, Route } from "magic";

export const router = new Router();

router
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Rule.Channel.Query.Json)
      , TE.chain(({ accountId }) => RuleFrontend.getByAccountId(context.db)(accountId))
      , TE.map((rules) => { return { rules: rules }; })
      , Route.respondWith(context)(Rule.Channel.Response.RuleList.Json)
    );
  })

router
  .get("/:ruleId", (context) => {
    const ruleId = context.params.ruleId;

    return pipe(
        Route.parseQuery(context)(Rule.Channel.Query.Json)
      , TE.chain(({ accountId }) => RuleFrontend.getById(context.db)(accountId)(ruleId))
      , Route.respondWith(context)(Rule.Internal.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        Route.parseBody(context)(Rule.Channel.Request.Create.Json)
      , TE.map((createRule) => { return { ...createRule, id: "" } })
      , TE.chain(RuleFrontend.create(context.db))
      , Route.respondWith(context)(Rule.Internal.Json)
    );
  });

router
  .delete("/:ruleId", (context) => {
    const ruleId = context.params.ruleId;

    return pipe(
        Route.parseQuery(context)(Rule.Channel.Query.Json)
      , TE.chain(({ accountId }) => RuleFrontend.deleteById(context.db)(accountId)(ruleId))
      , Route.respondWithOk(context)
    );
  });

