import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "../magic";

export namespace Internal {
  const PlaidCredentials = iot.type({
      _type: iot.literal("Plaid")
    , itemId: iot.string
    , accessToken: iot.string
  });

  const NullCredentials = iot.type({
    _type: iot.literal("Null")
  });

  export const Credentials = iot.union([PlaidCredentials, NullCredentials]);
  export type Credentials = iot.TypeOf<typeof Credentials>;

  const t = iot.type({
      id: iot.string
    , userId: iot.string
    , name: iot.string
    , credentials: Credentials
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , user_id: iot.string
      , name: iot.string
      , credentials: Credentials
    });    

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft(Exception.throwInternalError)
        , E.map(({ id, user_id, name, credentials }) => {
            return { id: id, userId: user_id, name: name, credentials: credentials }
          })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , user_id: obj.userId
        , name: obj.name
        , credentials: obj.credentials
      }
    }
  };
}

export namespace Frontend {
  export namespace Create {
    const t = iot.type({
        id: iot.string
      , userId: iot.string
      , name: iot.string
      , credentials: Internal.Credentials
    });

    export type t = iot.TypeOf<typeof t>;
    export const Json = new Format.JsonFormatter(t);
  }
}
