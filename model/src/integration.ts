import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "magic";

export namespace Internal {
  export const PlaidCredentials = iot.type({
      _type: iot.literal("Plaid")
    , itemId: iot.string
    , accessToken: iot.string
  });

  export const Credentials = PlaidCredentials;
  export type Credentials = iot.TypeOf<typeof Credentials>;

  export const t = iot.type({
      name: iot.string
    , credentials: PlaidCredentials
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new Format.JsonFormatter(t);
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
      export const Json = new Format.JsonFormatter(t);
    }
  }
}
