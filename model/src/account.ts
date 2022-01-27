import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";
import camelcaseKeys from "camelcase-keys";

import * as Rule from "./rule";
import { Formatter, JsonFormatter } from "./util";

import { Exception } from "magic";

export namespace Internal {
  const t = iot.type({
      id: iot.string
    , parentId: types.option(iot.string)
    , userId: iot.string
    , name: iot.string
    , rules: iot.array(Rule.Internal.t)
    , children: iot.array(iot.string)
  });

  export type t = iot.TypeOf<typeof t>;
  export const Json = new JsonFormatter(t);
  export const Database = new class implements Formatter<t> {
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
  export namespace Request {
    export namespace Create {
      const t = iot.type({
          parentId: types.option(iot.string)
        , userId: iot.string
        , name: iot.string
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new JsonFormatter(t);
    }
  }
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , parent_id: types.optionFromNullable(iot.string)
    , user_id: iot.string
    , name: iot.string
  });

  export const from = (account: any): E.Either<Error, Internal.t> => {
    return pipe(
        account
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(account => { return { ...account, id: account.id, rules: [], children: [] }; })
      , E.mapLeft(E.toError)
    );
  };
}
