import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import * as Rule from "./rule";

import { Exception, Format } from "../magic";

export namespace Internal {
  export const t = iot.type({
      id: iot.string
    , accountId: iot.string
    , userId: iot.string
    , template: iot.object
  });
  export type t = iot.TypeOf<typeof t>;

  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , account_id: iot.string
      , user_id: iot.string
      , template: iot.object
    });

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft(Exception.throwInternalError)
        , E.map(({ id, account_id, user_id, template }) => {
            return { id: id, accountId: account_id, userId: user_id, template: template };
          })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , account_id: obj.accountId
        , user_id: obj.userId
        , template: obj.template
      }
    }
  };
}

export namespace Frontend {
  export namespace Create {
    const t = iot.type({
        id: iot.string
      , accountId: iot.string
      , userId: iot.string
      , template: iot.object
    });

    export type t = iot.TypeOf<typeof t>;
    export const Json = new Format.JsonFormatter(t);
  }
}
