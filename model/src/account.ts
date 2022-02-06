import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import * as Rule from "./rule";

import { Exception, Format } from "magic";

export namespace Internal {
  export type t = {
    id: string;
    name: string;
    rules: Rule.Internal.t[];
    children: t[]
  }

  export const t: iot.Type<t> = iot.recursion('t', () => iot.type({
      id: iot.string
    , name: iot.string
    , rules: iot.array(Rule.Internal.t)
    , children: iot.array(t)
  }));

  export const Json = new Format.JsonFormatter(t);
}

export namespace Channel {
  export namespace Query {
    export namespace ByParent {
      const t = iot.type({
          userEmail: iot.string
        , parentId: types.optionFromNullable(iot.string)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }

    export namespace ByEmail {
      const t = iot.type({
        userEmail: iot.string
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }
  
  export namespace Request {
    export namespace Create {
      const t = iot.type({
        name: iot.string
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }

  export namespace Response {
    export namespace AccountList {
      const t = iot.type({
        accounts: iot.array(Internal.t)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }
}
