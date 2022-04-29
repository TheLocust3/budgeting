import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Generic } from "model";
import { Message, Route } from "magic";

export const router = new Route.Router();

router
  .get("/status", (context) => {
    return pipe(
        TE.of({ status: "ok" })
      , Route.respondWith(context)(Generic.Response.Status.Json)
    );
  });
