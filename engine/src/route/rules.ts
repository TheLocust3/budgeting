import crypto from "crypto";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { PathReporter } from "io-ts/PathReporter";

import RuleFrontend from "../frontend/rule-frontend";

import { Rule } from "model";
import { Message, Route } from "magic";

export const router = new Route.Router();

router
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Rule.Channel.Query.Json)
      , TE.chain(({ userEmail, accountId }) => RuleFrontend.getByAccountId(userEmail)(accountId))
      , TE.map((rules) => { return { rules: rules }; })
      , Route.respondWith(context)(Rule.Channel.Response.RuleList.Json)
    );
  })

router
  .post("/", (context) => {
    return pipe(
        TE.Do
      , TE.bind("query", () => Route.parseQuery(context)(Rule.Channel.Query.Json))
      , TE.bind("createRule", () => Route.parseBody(context)(Rule.Channel.Request.Create.Json))
      , TE.bind("rule", ({ createRule }) => { return TE.of({ ...createRule, id: crypto.randomUUID() }); })
      , TE.chain(({ query, rule }) => RuleFrontend.create(query.userEmail)(query.accountId)(rule))
      , Route.respondWith(context)(Rule.Internal.Json)
    );
  });

router
  .delete("/:ruleId", (context) => {
    const ruleId = context.request.params.ruleId;

    return pipe(
        Route.parseQuery(context)(Rule.Channel.Query.Json)
      , TE.chain(({ userEmail, accountId }) => RuleFrontend.deleteById(userEmail)(accountId)(ruleId))
      , Route.respondWithOk(context)
    );
  });

