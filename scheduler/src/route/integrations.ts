import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import IntegrationFrontend from "../frontend/integration-frontend";

import { Integration } from "model";
import { Message, Route } from "magic";

export const router = new Router();

router
  .get("/", async (ctx, next) => {
    await pipe(
        ctx.query.userId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain(IntegrationFrontend.all(ctx.db))
      , TE.map(A.map(Integration.Internal.Json.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (integrations) => {
              ctx.body = { integrations: integrations };
            }
        )
    )();
  })
  .get("/:integrationId", async (ctx, next) => {
    const integrationId = ctx.params.integrationId;
    await pipe(
        ctx.query.userId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain((userId) => IntegrationFrontend.getById(ctx.db)(userId)(integrationId))
      , TE.map(Integration.Internal.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (integration) => {
              ctx.body = integration;
            }
        )
    )();
  })
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Integration.Channel.Request.Create.Json.from
      , E.map((createIntegration) => { return { ...createIntegration, id: "" } })
      , TE.fromEither
      , TE.chain(IntegrationFrontend.create(ctx.db))
      , TE.map(Integration.Internal.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (integration) => {
              ctx.body = integration;
            }
        )
    )();
  })
  .delete("/:sourceId", async (ctx, next) => {
    const sourceId = ctx.params.sourceId;
    await pipe(
        ctx.query.userId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain((userId) => IntegrationFrontend.deleteById(ctx.db)(userId)(sourceId))
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  });
