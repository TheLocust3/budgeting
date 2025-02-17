import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import * as Rule from "./rule";

import { Exception, Format } from "../magic";

export namespace Internal {
  export const Metadata = iot.type({
    sourceId: types.option(iot.string)
  });
  export type Metadata = iot.TypeOf<typeof Metadata>;

  export const t = iot.type({
      id: iot.string
    , parentId: types.option(iot.string)
    , userId: iot.string
    , name: iot.string
    , metadata: Metadata
  });
  export type t = iot.TypeOf<typeof t>;

  const WithChildren = iot.type({
    children: iot.array(iot.string)
  });
  export type WithChildren = iot.TypeOf<typeof WithChildren>;

  const WithRules = iot.type({
    rules: iot.array(Rule.Internal.t)
  });
  export type WithRules = iot.TypeOf<typeof WithRules>;

  export type Rich = t & WithChildren & WithRules

  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , parent_id: types.optionFromNullable(iot.string)
      , user_id: iot.string
      , name: iot.string
      , metadata: types.optionFromNullable(Metadata)
    });

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft(Exception.throwInternalError)
        , E.map(({ id, parent_id, user_id, name, metadata }) => {
            const resolvedMetadata = pipe(metadata, O.getOrElse(() => <Metadata>{ sourceId: O.none }));
            return { id: id, parentId: parent_id, userId: user_id, name: name, metadata: resolvedMetadata };
          })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , parent_id: obj.parentId
        , user_id: obj.userId
        , name: obj.name
        , metadata: obj.metadata
      }
    }
  };
}

export namespace Frontend {
  export namespace Create {
    const t = iot.type({
        id: iot.string
      , parentId: types.option(iot.string)
      , userId: iot.string
      , name: iot.string
      , metadata: Internal.Metadata
    });

    export type t = iot.TypeOf<typeof t>;
    export const Json = new Format.JsonFormatter(t);
  }
}

export namespace Channel {
  export namespace Query {
    const t = iot.type({
      userId: iot.string
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
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
