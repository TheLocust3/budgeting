import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { PathReporter } from "io-ts/PathReporter";

import Validate from "../rule/validate";

import { Rule } from "model";
import { RuleFrontend } from "storage";
import { Message, Route } from "magic";

export const router = new Route.Router();

router
  .get("/", (context) => {
    return pipe(
        Route.parseQuery(context)(Rule.Channel.Query.Json)
      , TE.chain(({ accountId }) => RuleFrontend.getByAccountId(context.request.app.locals.db)(accountId))
      , TE.map((rules) => { return { rules: rules }; })
      , Route.respondWith(context)(Rule.Channel.Response.RuleList.Json)
    );
  })

router
  .get("/:ruleId", (context) => {
    const ruleId = context.request.params.ruleId;

    return pipe(
        Route.parseQuery(context)(Rule.Channel.Query.Json)
      , TE.chain(({ accountId }) => RuleFrontend.getById(context.request.app.locals.db)(accountId)(ruleId))
      , Route.respondWith(context)(Rule.Internal.Json)
    );
  });

router
  .post("/", (context) => {
    return pipe(
        Route.parseBody(context)(Rule.Frontend.Create.Json)
      , TE.chain((rule) => Validate.rule(context.request.app.locals.db)(rule))
      , TE.chain(RuleFrontend.create(context.request.app.locals.db))
      , Route.respondWith(context)(Rule.Internal.Json)
    );
  });

router
  .delete("/:ruleId", (context) => {
    const ruleId = context.request.params.ruleId;

    return pipe(
        Route.parseQuery(context)(Rule.Channel.Query.Json)
      , TE.chain(({ accountId }) => RuleFrontend.deleteById(context.request.app.locals.db)(accountId)(ruleId))
      , Route.respondWithOk(context)
    );
  });

