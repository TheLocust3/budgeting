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

export namespace UserEntry {
  const entry = new Entry(passthrough, { root: rootPath, name: "user", format: User.Internal.Json });

  const storageWriter = Writers.overwriteWriter<User.Internal.t>();

  export const idFor = (email: string) => hash(email);

  export const list = () : TE.TaskEither<Exception.t, string[]> => {
    return entry.listObjects();
  }

  export const byEmail = (email: string) : TE.TaskEither<Exception.t, User.Internal.t> => {
    const objectId = idFor(email);

    return entry.getObject(objectId);
  }

  export const create = (user: User.Internal.t) : TE.TaskEither<Exception.t, User.Internal.t> => {
    const objectId = idFor(user.email);
    const writer = storageWriter(user);

    return pipe(
        entry.putObject(objectId)(writer)
      , TE.map(() => user)
    );
  }
}
