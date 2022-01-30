import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "magic";

export namespace Internal {
  const t = iot.type({
      id: iot.string
    , sourceId: iot.string
    , userId: iot.string
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
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , source_id: iot.string
      , user_id: iot.string
      , amount: types.NumberFromString
      , merchant_name: iot.string
      , description: iot.string
      , authorized_at: types.date
      , captured_at: types.optionFromNullable(types.date)
      , metadata: iot.object
    });

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft((_) => Exception.throwInternalError)
        , E.map(({ id, source_id, user_id, amount, merchant_name, description, authorized_at, captured_at, metadata }) => {
            return {
                id: id
              , sourceId: source_id
              , userId: user_id
              , amount: amount
              , merchantName: merchant_name
              , description: description
              , authorizedAt: authorized_at
              , capturedAt: captured_at
              , metadata: metadata
              , custom: {}
            };
          })
      );
    }

    public to = (obj: t): any => {
      return {} // TODO: JK we don't use this anywhere but should probably implement it
    }
  };

  export namespace Field {
    export type NumberField = "amount" | "authorizedAt" | "capturedAt";
    export const NumberField: iot.Type<Internal.Field.NumberField> = iot.union([
        iot.literal("amount")
      , iot.literal("authorizedAt")
      , iot.literal("capturedAt")
    ]);

    export type OptionNumberField = "capturedAt";
    export const OptionNumberField: iot.Type<Internal.Field.OptionNumberField> = iot.literal("capturedAt");

    export type StringField = "id" | "sourceId" | "userId" | "merchantName" | "description";
    export const StringField: iot.Type<Internal.Field.StringField> = iot.union([
        iot.literal("id")
      , iot.literal("sourceId")
      , iot.literal("userId")
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
  export namespace Request {
    export namespace Create {
      const t = iot.type({
          sourceId: iot.string
        , userId: iot.string
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
}
