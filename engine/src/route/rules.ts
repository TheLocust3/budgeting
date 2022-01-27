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
  .get("/", async (ctx, next) => {
    await pipe(
        ctx.query.accountId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain(RuleFrontend.getByAccountId(ctx.db))
      , TE.map(A.map(Rule.Internal.Json.to))
      , TE.match(
          Message.respondWithError(ctx),
          (rules) => {
            ctx.body = { rules: rules };
          }
        )
    )();
  })
  .get("/:ruleId", async (ctx, next) => {
    const ruleId = ctx.params.ruleId;
    await pipe(
        ctx.query.accountId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain((accountId) => RuleFrontend.getById(ctx.db)(accountId)(ruleId))
      , TE.map(Rule.Internal.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (rule) => {
              ctx.body = rule;
            }
        )
    )();
  })
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Rule.Channel.Request.Create.Json.from
      , E.map((createRule) => { return { ...createRule, id: "" } })
      , TE.fromEither
      , TE.chain(RuleFrontend.create(ctx.db))
      , TE.map(Rule.Internal.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (rule) => {
              ctx.body = rule;
            }
        )
    )();
  })
  .delete("/:ruleId", async (ctx, next) => {
    const ruleId = ctx.params.ruleId;
    await pipe(
        ctx.query.accountId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain((accountId) => RuleFrontend.deleteById(ctx.db)(accountId)(ruleId))
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  });

