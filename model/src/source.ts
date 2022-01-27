import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Formatter, JsonFormatter } from "./util";

import { Exception } from "magic";

export namespace Internal {
  const t = iot.type({
      id: iot.string
    , userId: iot.string
    , name: iot.string
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new JsonFormatter(t);
  export const Database = new class implements Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , user_id: iot.string
      , name: iot.string
    });    

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft((_) => Exception.throwInternalError)
        , E.map(({ id, user_id, name }) => { return { id: id, userId: user_id, name: name } })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , user_id: obj.userId
        , name: obj.name
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
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new JsonFormatter(t);
    }
  }
}

export namespace Frontend {
  export namespace Request {
    export namespace Create {
      const t = iot.type({
        name: iot.string
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new JsonFormatter(t);
    }
  }
}
