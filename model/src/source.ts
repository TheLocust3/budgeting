import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception, Format } from "magic";

export namespace Internal {
  const PlaidMetadata = iot.type({
      _type: iot.literal("Plaid")
    , accountId: iot.string
  });
  export type PlaidMetadata = iot.TypeOf<typeof PlaidMetadata>

  export const t = iot.type({
      id: iot.string
    , userId: iot.string
    , name: iot.string
    , integrationId: types.option(iot.string)
    , metadata: types.option(PlaidMetadata)
    , createdAt: types.option(types.DateFromISOString)
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , user_id: iot.string
      , name: iot.string
      , integration_id: types.optionFromNullable(iot.string)
      , metadata: types.optionFromNullable(PlaidMetadata)
      , created_at: types.date
    });    

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft((_) => Exception.throwInternalError)
        , E.map(({ id, user_id, name, integration_id, created_at, metadata }) => {
            return { id: id, userId: user_id, name: name, integrationId: integration_id, metadata: metadata, createdAt: O.some(created_at) };
          })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , user_id: obj.userId
        , name: obj.name
        , integration_id: obj.integrationId
        , metadata: obj.metadata
        , created_at: obj.createdAt
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
        , integrationId: types.option(iot.string)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }
}

export namespace Frontend {
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
