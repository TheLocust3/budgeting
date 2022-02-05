import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "magic";

export const DEFAULT_ROLE = "user";

export namespace Internal {
  export const t = iot.type({
      email: iot.string
    , password: iot.string
    , role: iot.string
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new Format.JsonFormatter(t);
}

export namespace Frontend {
  export namespace Request {
    export namespace Credentials {
      const t = iot.type({
          email: iot.string
        , password: iot.string
      });
      
      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }

    export namespace Create {
      const t = iot.type({
          email: iot.string
        , password: iot.string
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }

  export namespace Response {
    export namespace Token {
      const t = iot.type({
        token: iot.string
      });
      
      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }

    export namespace UserList {
      const t = iot.type({
          users: iot.array(Internal.t)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }
}
