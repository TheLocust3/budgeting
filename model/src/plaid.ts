import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Formatter, JsonFormatter } from "./util";

import { Exception } from "magic";

export namespace Frontend {
  export namespace Request {
    export namespace ExchangePublicToken {
      const t = iot.type({
        publicToken: iot.string
      });

      export type t = iot.TypeOf<typeof t>;
      export const Json = new JsonFormatter(t);
    }
  }

  export namespace Response {
    export namespace CreateLinkToken {
      const t = iot.type({
        token: iot.string
      });

      export type t = iot.TypeOf<typeof t>;
      export const Json = new JsonFormatter(t);
    }
  }
}