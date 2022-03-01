import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "magic";

export namespace Internal {
  export const t = iot.type({
      id: iot.string
    , userId: iot.string
    , name: iot.string
    , integrationId: types.option(iot.string)
    , tag: iot.string
    , createdAt: types.DateFromISOString
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , user_id: iot.string
      , name: iot.string
      , integration_id: types.optionFromNullable(iot.string)
      , tag: iot.string
      , created_at: types.date
    });    

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft((_) => Exception.throwInternalError)
        , E.map(({ id, user_id, name, integration_id, created_at, tag }) => {
            return { id: id, userId: user_id, name: name, integrationId: integration_id, tag: tag, createdAt: created_at };
          })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , user_id: obj.userId
        , name: obj.name
        , integration_id: obj.integrationId
        , tag: obj.tag
        , created_at: obj.createdAt
      }
    }
  };
}

export namespace Frontend {
  export namespace Create {
    const t = iot.type({
        userId: iot.string
      , name: iot.string
      , integrationId: types.option(iot.string)
      , tag: iot.string
    });

    export type t = iot.TypeOf<typeof t>;
    export const Json = new Format.JsonFormatter(t);
  }
}

export namespace Channel {
  export namespace Request {
    export namespace Create {
      const t = iot.type({
          userId: iot.string
        , name: iot.string
        , integrationId: types.option(iot.string)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }
}

export namespace External {
  export namespace Request {
    export namespace Create {
      const t = iot.type({
          name: iot.string
        , integrationId: types.option(iot.string)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }

  export namespace Response {
    export namespace SourceList {
      const t = iot.type({
          sources: iot.array(Internal.t)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }
}
