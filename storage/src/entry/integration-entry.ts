import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Entry } from "./entry";
import { UserEntry } from "./user-entry";
import { rootPath, hash, passthrough, Writers } from "./util";

import { Integration } from "model";
import { Exception, Format } from "magic";

export namespace IntegrationEntry {
  namespace Storage {
    const t = iot.type({
      integrations: iot.array(Integration.Internal.t)
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
  }

  const entry = new Entry(passthrough, { root: rootPath, name: "integrations", format: Storage.Json });

  const storageWriter = Writers.orDefaultWriter<Storage.t>({ integrations: []});

  export const allByUser = (userEmail: string) : TE.TaskEither<Exception.t, Integration.Internal.t[]> => {
    const objectId = UserEntry.idFor(userEmail);

    return pipe(
        entry.getObject(objectId)
      , TE.map((stored) => stored.integrations)
    );
  }

  export const create =
    (userEmail: string) =>
    (integration: Integration.Internal.t): TE.TaskEither<Exception.t, void> => {
    const objectId = UserEntry.idFor(userEmail);
    const writer = storageWriter((saved: Storage.t) => {
      return { integrations: [integration] }; // TODO: JK
    })

    return pipe(
        entry.putObject(objectId)(writer)
      , TE.map(() => {})
    );
  }

  export const deleteById = (userEmail: string) => (id: string) : TE.TaskEither<Exception.t, void> => {
    const objectId = UserEntry.idFor(userEmail);
    const writer = storageWriter((saved: Storage.t) => {
      return { integrations: [] }; // TODO: JK
    })

    return pipe(
        entry.putObject(objectId)(writer)
      , TE.map(() => {})
    );
  }
}
