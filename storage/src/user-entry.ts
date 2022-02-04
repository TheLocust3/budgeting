import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Passthrough } from "./passthrough";
import { rootPath, hash } from "./util";

import { User } from "model";
import { Exception } from "magic";

namespace UserEntry {
  const path = (email: string) => `${rootPath}/users/${hash(email)}.json`

  export const byEmail = (passthrough: Passthrough) => (email: string) : TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        path(email)
      , passthrough.getObject(User.Internal.Json)
    );
  }

  export const create = (passthrough: Passthrough) => (user: User.Internal.t) : TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        path(user.email)
      , passthrough.putObject(User.Internal.Json)(() => user)
    );
  }

  export const deleteByEmail = (passthrough: Passthrough) => (email: string) : TE.TaskEither<Exception.t, void> => {
    return pipe(
        path(email)
      , passthrough.deleteObject
    );
  }
}

export default UserEntry;
