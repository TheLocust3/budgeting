import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Formatter, JsonFormatter } from "./util";

import { Exception } from "magic";

export const DEFAULT_ROLE = "user";

export namespace Internal {
  const t = iot.type({
      id: iot.string
    , email: iot.string
    , password: iot.string
    , role: iot.string
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new JsonFormatter(t);
  export const Database = new class implements Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , email: iot.string
      , password: iot.string
      , role: iot.string
    });    

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft((_) => Exception.throwInternalError)
      );
    }

    public to = (obj: t): any => {
      return this.TableType.encode(obj);
    }
  };
}

export namespace Frontend {
  export namespace Request {
    export namespace Credentials {
      const t = iot.type({
          email: iot.string
        , password: iot.string
      });
      
      export type t = iot.TypeOf<typeof t>
      export const Json = new JsonFormatter(t);
    }

    export namespace Create {
      const t = iot.type({
          email: iot.string
        , password: iot.string
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new JsonFormatter(t);
    }
  }

  export namespace Response {
    export namespace Token {
      const t = iot.type({
        token: iot.string
      });
      
      export type t = iot.TypeOf<typeof t>
      export const Json = new JsonFormatter(t);
    }
  }
}
