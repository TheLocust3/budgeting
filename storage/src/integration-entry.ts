import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Entry } from "./entry";
import UserEntry from "./user-entry";
import { rootPath, hash, passthrough, Writers } from "./util";

import { Integration } from "model";
import { Exception, Format } from "magic";

namespace IntegrationEntry {
  namespace Storage {
    const t = iot.type({
      integrations: iot.array(Integration.Internal.t)
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
  }

  const entry = new Entry(passthrough, { root: rootPath, name: "integrations", format: Storage.Json });

  const storageWriter = Writers.orDefaultWriter<Storage.t>({ integrations: []});

  export const all = (email: string) : TE.TaskEither<Exception.t, Integration.Internal.t[]> => {
    const id = UserEntry.idFor(email);

    return pipe(
        entry.getObject(id)
      , TE.map((stored) => stored.integrations)
    );
  }

  export const create =
    (email: string) =>
    (integration: Integration.Internal.t): TE.TaskEither<Exception.t, void> => {
    const id = UserEntry.idFor(email);
    const writer = storageWriter((saved: Storage.t) => {
      return { integrations: [integration] }; // TODO: JK
    })

    return pipe(
        entry.putObject(id)(writer)
      , TE.map(() => {})
    );
  }

  export const deleteByEmail = (email: string) : TE.TaskEither<Exception.t, void> => {
    const id = UserEntry.idFor(email);
    const writer = storageWriter((saved: Storage.t) => {
      return { integrations: [] }; // TODO: JK
    })

    return pipe(
        entry.putObject(id)(writer)
      , TE.map(() => {})
    );
  }
}

export default IntegrationEntry;
