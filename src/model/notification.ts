import crypto from "crypto";
import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "../magic";

export namespace Internal {
  const PullerFailure = iot.type({
    _type: iot.literal("PullerFailure")
  });
  type PullerFailure = iot.TypeOf<typeof PullerFailure>;

  const NewTransactions = iot.type({
    _type: iot.literal("NewTransactions")
  });
  type NewTransactions = iot.TypeOf<typeof NewTransactions>;

  export const Metadata = iot.union([PullerFailure, NewTransactions]);;
  export type Metadata = iot.TypeOf<typeof Metadata>;

  export const t = iot.type({
      id: iot.string
    , userId: iot.string
    , createdAt: types.DateFromISOString
    , title: iot.string
    , body: iot.string
    , acked: iot.boolean
    , metadata: Metadata
  });
  export type t = iot.TypeOf<typeof t>;

  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , user_id: iot.string
      , created_at: types.date
      , title: iot.string
      , body: iot.string
      , acked: iot.boolean
      , metadata: Metadata
    });

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft(Exception.throwInternalError)
        , E.map(({ id, user_id, created_at, title, body, acked, metadata }) => {
            return { id: id, userId: user_id, createdAt: created_at, title: title, body: body, acked: acked, metadata: metadata };
          })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , user_id: obj.userId
        , created_at: obj.createdAt
        , title: obj.title
        , body: obj.body
        , acked: obj.acked
        , metadata: obj.metadata
      }
    }
  };
}

export namespace Frontend {
  export namespace Create {
    const t = iot.type({
        id: iot.string
      , userId: iot.string
      , title: iot.string
      , body: iot.string
      , metadata: Internal.Metadata
    });

    export type t = iot.TypeOf<typeof t>;
    export const Json = new Format.JsonFormatter(t);

    export const pullerFailure = (userId: string) => (exception: Exception.t): t => ({
        id: crypto.randomUUID()
      , userId: userId
      , title: "Failed to pull transactions"
      , body: `Error: ${exception.name}`
      , metadata: { _type: "PullerFailure" }
    })

    export const newTransactions = (userId: string) => (count: number): t => ({
        id: crypto.randomUUID()
      , userId: userId
      , title: `You have ${count} new uncategorized transactions`
      , body: ""
      , metadata: { _type: "NewTransactions" }
    })
  }
}
