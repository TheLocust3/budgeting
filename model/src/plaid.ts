import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "magic";

export namespace Frontend {
  export namespace Request {
    export namespace ExchangePublicToken {
      const Account = iot.type({
          id: iot.string
        , name: iot.string
      });
      export type Account = iot.TypeOf<typeof Account>;

      const t = iot.type({
          publicToken: iot.string
        , accounts: iot.array(Account)
        , institutionName: iot.string
      });

      export type t = iot.TypeOf<typeof t>;
      export const Json = new Format.JsonFormatter(t);
    }
  }

  export namespace Response {
    export namespace CreateLinkToken {
      const t = iot.type({
        token: iot.string
      });

      export type t = iot.TypeOf<typeof t>;
      export const Json = new Format.JsonFormatter(t);
    }
  }
}