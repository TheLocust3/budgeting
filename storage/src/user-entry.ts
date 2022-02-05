import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Entry } from "./entry";
import { rootPath, hash, passthrough, Writers } from "./util";

import { User } from "model";
import { Exception, Format } from "magic";

namespace UserEntry {
  const entry = new Entry(passthrough, { root: rootPath, name: "user", format: User.Internal.Json });

  const storageWriter = Writers.overwriteWriter<User.Internal.t>();

  export const idFor = (email: string) => hash(email);

  export const getByEmail = (email: string) : TE.TaskEither<Exception.t, User.Internal.t> => {
    const id = idFor(email);

    return entry.getObject(id);
  }

  export const create = (user: User.Internal.t) : TE.TaskEither<Exception.t, void> => {
    const id = idFor(user.email);
    const writer = storageWriter(user);

    return pipe(
        entry.putObject(id)(writer)
      , TE.map(() => {})
    );
  }
}

export default UserEntry;
