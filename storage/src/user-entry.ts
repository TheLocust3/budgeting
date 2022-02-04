import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Passthrough } from "./passthrough";
import { rootPath, hash } from "./util";

import { User } from "model";
import { Exception, Format } from "magic";

namespace UserEntry {
  namespace Storage {
    export const t = iot.type({
        email: iot.string
      , password: iot.string
      , role: iot.string
    });

    export type t = iot.TypeOf<typeof t>

    export const Json = new Format.JsonFormatter(t);

    export const ToInternal = new class implements Format.Conversion<t, User.Internal.t> {
      public to = (user: t): User.Internal.t => {
        return { id: idFor(user.email), email: user.email, password: user.password, role: user.role };
      }
    };

    export const FromInternal = new class implements Format.Conversion<User.Internal.t, t> {
      public to = (user: User.Internal.t): t => {
        return { email: user.email, password: user.password, role: user.role };
      }
    };
  }

  const idFor = (email: string) => hash(email);
  const pathFor = (email: string) => `${rootPath}/users/${idFor(email)}.json`;

  export const byEmail = (passthrough: Passthrough) => (email: string) : TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        pathFor(email)
      , passthrough.getObject(Storage.Json)
      , TE.map(Storage.ToInternal.to)
    );
  }

  export const create = (passthrough: Passthrough) => (user: User.Internal.t) : TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        pathFor(user.email)
      , passthrough.putObject(Storage.Json)(() => Storage.FromInternal.to(user))
      , TE.map(Storage.ToInternal.to)
    );
  }

  export const deleteByEmail = (passthrough: Passthrough) => (email: string) : TE.TaskEither<Exception.t, void> => {
    return pipe(
        pathFor(email)
      , passthrough.deleteObject
    );
  }
}

export default UserEntry;
