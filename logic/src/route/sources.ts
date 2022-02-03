import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import SourceFrontend from "../frontend/source-frontend";
import { AuthenticationFor } from "./util";

import { Source } from "model";
import { Message, Route } from "magic";

export const router = new Route.Router();

router
  .use(AuthenticationFor.user)

router
  .get("/", (context) => {
    const user = context.response.locals.user;

    return pipe(
        SourceFrontend.all(context.request.app.locals.db)(user.id)
      , TE.map((sources) => { return { sources: sources }; })
      , Route.respondWith(context)(Source.Frontend.Response.SourceList.Json)
    );
  });

router
  .get("/:sourceId", (context) => {
    const user = context.response.locals.user;
    const sourceId = context.request.params.sourceId;

    return pipe(
        SourceFrontend.getById(context.request.app.locals.db)(user.id)(sourceId)
      , Route.respondWith(context)(Source.Internal.Json)
    );
  });

router
  .post("/", (context) => {
    const user = context.response.locals.user;

    return pipe(
        Route.parseBody(context)(Source.Frontend.Request.Create.Json)
      , TE.map((createSource) => { return { ...createSource, id: "", userId: user.id, metadata: O.none, createdAt: O.none } })
      , TE.chain(SourceFrontend.create(context.request.app.locals.db))
      , Route.respondWith(context)(Source.Internal.Json)
    );
  });

router
  .delete("/:sourceId", (context) => {
    const user = context.response.locals.user;
    const sourceId = context.request.params.sourceId;

    return pipe(
        SourceFrontend.deleteById(context.request.app.locals.db)(user.id)(sourceId)
      , Route.respondWithOk(context)
    );
  });
