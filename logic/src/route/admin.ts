import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { AuthenticationFor } from "./util";

import { User } from "model";
import { UserFrontend } from "storage";
import { Route } from "magic";

export const router = new Route.Router();

router
  .use(AuthenticationFor.admin)

router
  .get('/:email', (context) => {
    const userEmail = context.request.params.userEmail;

    return pipe(
        UserFrontend.getByEmail(userEmail)
      , Route.respondWith(context)(User.Internal.Json)
    );
  });
