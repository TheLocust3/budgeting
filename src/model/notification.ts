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
        , E.map(({ id, user_id, title, body, acked, metadata }) => {
            return { id: id, userId: user_id, title: title, body: body, acked: acked, metadata: metadata };
          })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , user_id: obj.userId
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

    const pullerFailure = (userId: string): t => ({
        id: crypto.randomUUID()
      , userId: userId
      , title: "Failed to pull transactions"
      , body: "" // TODO: JK
      , metadata: { _type: "PullerFailure" }
    })

    const newTransactions = (userId: string): t => ({
        id: crypto.randomUUID()
      , userId: userId
      , title: "You have new uncategorized transactions"
      , body: "" // TODO: JK
      , metadata: { _type: "NewTransactions" }
    })
  }
}
