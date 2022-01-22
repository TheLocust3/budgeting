import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import SourceFrontend from "../frontend/source-frontend";

import { Source } from "model";
import { Message, Route } from "magic";

export const router = new Router();

router
  .get("/", async (ctx, next) => {
    await pipe(
        ctx.query.userId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain(SourceFrontend.all(ctx.db))
      , TE.map(A.map(Source.Channel.Response.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (sources) => {
              ctx.body = { sources: sources };
            }
        )
    )();
  })
  .get("/:sourceId", async (ctx, next) => {
    const sourceId = ctx.params.sourceId;
    await pipe(
        ctx.query.userId
      , Route.fromQuery
      , TE.fromEither
      , TE.chain((userId) => SourceFrontend.getById(ctx.db)(userId)(sourceId))
      , TE.map(Source.Channel.Response.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (source) => {
              ctx.body = source;
            }
        )
    )();
  })
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Source.Channel.Request.from
      , TE.fromEither
      , TE.chain(SourceFrontend.create(ctx.db))
      , TE.map(Source.Channel.Response.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (source) => {
              ctx.body = source;
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
      , TE.chain((userId) => SourceFrontend.deleteById(ctx.db)(userId)(sourceId))
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  });
