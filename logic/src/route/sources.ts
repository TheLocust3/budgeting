import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import SourceFrontend from "../frontend/source-frontend";
import { AuthenticationFor } from "./util";

import { Source } from "model";
import { Message } from "magic";

export const router = new Router();

router
  .use(AuthenticationFor.user)
  .get("/", async (ctx, next) => {
    const user = ctx.state.user;
    await pipe(
        SourceFrontend.all(ctx.db)(user.id)
      , TE.map(A.map(Source.Internal.Json.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (sources) => {
              ctx.body = { sources: sources };
            }
        )
    )();
  })
  .get("/:sourceId", async (ctx, next) => {
    const user = ctx.state.user;
    const sourceId = ctx.params.sourceId;
    await pipe(
        sourceId
      , SourceFrontend.getById(ctx.db)(user.id)
      , TE.map(Source.Internal.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (source) => {
              ctx.body = { source: source };
            }
        )
    )();
  })
  .post("/", async (ctx, next) => {
    const user = ctx.state.user;
    await pipe(
        ctx.request.body
      , Source.Frontend.Request.Create.Json.from
      , E.map((createSource) => { return { ...createSource, id: "", userId: user.id } })
      , TE.fromEither
      , TE.chain(SourceFrontend.create(ctx.db))
      , TE.map(Source.Internal.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (source) => {
              ctx.body = source;
            }
        )
    )();
  })
  .delete("/:sourceId", async (ctx, next) => {
    const user = ctx.state.user;
    const sourceId = ctx.params.sourceId;
    await pipe(
        sourceId
      , SourceFrontend.deleteById(ctx.db)(user.id)
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  });
