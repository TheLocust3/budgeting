import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "../magic";

export const DEFAULT_ROLE = "user";
export const SUPERUSER_ROLE = "superuser";

export namespace Internal {
  export const t = iot.type({
      id: iot.string
    , email: iot.string
    , role: iot.string
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , email: iot.string
      , role: iot.string
    });    

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft(Exception.throwInternalError)
      );
    }

    public to = (obj: t): any => {
      return this.TableType.encode(obj);
    }
  };
}

export namespace Frontend {
  export namespace Create {
    const t = iot.type({
        id: iot.string
      , email: iot.string
      , role: iot.string
    });

    export type t = iot.TypeOf<typeof t>;
    export const Json = new Format.JsonFormatter(t);
  }

  export namespace FromFirebase {
    const t = iot.type({
        id: iot.string
      , email: iot.string
    });

    export type t = iot.TypeOf<typeof t>;
    export const Json = new Format.JsonFormatter(t);
  }
}
