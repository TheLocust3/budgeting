import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import * as Rule from "./rule";

import { Exception, Format } from "magic";

export namespace Internal {
  export const t = iot.type({
      id: iot.string
    , parentId: types.option(iot.string)
    , userId: iot.string
    , name: iot.string
    , rules: iot.array(Rule.Internal.t)
    , children: iot.array(iot.string)
  });

  export type t = iot.TypeOf<typeof t>;
  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t, any> {
    TableType = iot.type({
        id: iot.string
      , parent_id: types.optionFromNullable(iot.string)
      , user_id: iot.string
      , name: iot.string
    });

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft((_) => Exception.throwInternalError)
        , E.map(({ id, parent_id, user_id, name }) => {
            return { id: id, parentId: parent_id, userId: user_id, name: name, rules: [], children: [] }
          })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , parent_id: obj.parentId
        , user_id: obj.userId
        , name: obj.name
      }
    }
  };
}

export namespace Channel {
  export namespace Query {
    const t = iot.type({
        userId: iot.string
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
  }
  
  export namespace Request {
    export namespace Create {
      const t = iot.type({
          parentId: types.option(iot.string)
        , userId: iot.string
        , name: iot.string
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
