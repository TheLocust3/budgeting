import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Formatter, JsonFormatter } from "./util";

import { Exception } from "magic";

export namespace Internal {
  const PlaidCredentials = iot.type({
      _type: iot.literal("Plaid")
    , itemId: iot.string
    , accessToken: iot.string
  });

  export const Credentials = PlaidCredentials;
  export type Credentials = iot.TypeOf<typeof Credentials>;

  const t = iot.type({
      id: iot.string
    , userId: iot.string
    , name: iot.string
    , credentials: PlaidCredentials
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new JsonFormatter(t);
  export const Database = new class implements Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , user_id: iot.string
      , name: iot.string
      , credentials: PlaidCredentials
    });    

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft((_) => Exception.throwInternalError)
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

export namespace Channel {
  export namespace Request {
    export namespace Create {
      const t = iot.type({
          userId: iot.string
        , name: iot.string
        , credentials: Internal.Credentials
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new JsonFormatter(t);
    }
  }
}
