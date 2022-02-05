import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "magic";

export namespace Internal {
  export const t = iot.type({
      id: iot.string
    , sourceId: iot.string
    , amount: iot.number
    , merchantName: iot.string
    , description: iot.string
    , authorizedAt: types.DateFromISOString
    , capturedAt: types.option(types.DateFromISOString)
    , metadata: iot.object
    , custom: iot.record(iot.string, iot.array(iot.string))
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new Format.JsonFormatter(t);

  export namespace Field {
    export type NumberField = "amount" | "authorizedAt" | "capturedAt";
    export const NumberField: iot.Type<Internal.Field.NumberField> = iot.union([
        iot.literal("amount")
      , iot.literal("authorizedAt")
      , iot.literal("capturedAt")
    ]);

    export type OptionNumberField = "capturedAt";
    export const OptionNumberField: iot.Type<Internal.Field.OptionNumberField> = iot.literal("capturedAt");

    export type StringField = "id" | "sourceId" | "merchantName" | "description";
    export const StringField: iot.Type<Internal.Field.StringField> = iot.union([
        iot.literal("id")
      , iot.literal("sourceId")
      , iot.literal("merchantName")
      , iot.literal("description")
    ]);

    export type t = NumberField | StringField;
    export const t: iot.Type<Internal.Field.t> = iot.union([
        NumberField
      , StringField
    ]);
  }
}

export namespace Channel {
  export namespace Query {
    const t = iot.type({
        userEmail: iot.string
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
  }

  export namespace Request {
    export namespace Create {
      const t = iot.type({
          sourceId: iot.string
        , amount: iot.number
        , merchantName: iot.string
        , description: iot.string
        , authorizedAt: iot.number
        , capturedAt: types.option(iot.number)
        , metadata: iot.object
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }

  export namespace Response {
    export namespace TransactionList {
      const t = iot.type({
        transactions: iot.array(Internal.t)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }
}
