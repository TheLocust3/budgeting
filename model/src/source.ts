import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";
import camelcaseKeys from "camelcase-keys";

import { Exception } from "magic";

export namespace Internal {
  export type t = {
    id: O.Option<string>;
    userId: string;
    name: string;
  }
}

export namespace Channel {
  export namespace Request {
    export const t = iot.type({
        userId: iot.string
      , name: iot.string
    });
    export type t = iot.TypeOf<typeof t>;

    export const from = (source: any): E.Either<Exception.t, Internal.t> => {
      return pipe(
          source
        , t.decode
        , E.map((source) => { return { ...source, id: O.none }; })
        , E.mapLeft((_) => Exception.throwMalformedJson)
      );
    };

    export const to = (source: Internal.t): t => {
      return {
          userId: source.userId
        , name: source.name
      };
    };
  }

  export namespace Response {
    export type t = {
      id: string;
      userId: string;
      name: string;
    };

    export const from = (source: any): E.Either<Exception.t, Internal.t> => {
      return E.right({
          ...source
        , id: O.some(source.id)
      })
    };

    export const to = (source: Internal.t): t => {
      return {
          id: O.match(() => "", (id: string) => id)(source.id)
        , userId: source.userId
        , name: source.name
      };
    };
  }
}

export namespace Json {
  export const Request = iot.type({
    name: iot.string
  });

  export const from = (userId: string) => (source: any): E.Either<Exception.t, Internal.t> => {
    return pipe(
        source
      , Request.decode
      , E.map((source) => { return { ...source, id: O.none, userId: userId }; })
      , E.mapLeft((_) => Exception.throwMalformedJson)
    );
  };

  export const to = (source: Internal.t): any => {
    return {
        id: O.match(() => "", (id: string) => id)(source.id)
      , userId: source.userId
      , name: source.name
    };
  };
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , user_id: iot.string
    , name: iot.string
  });

  export const from = (source: any): E.Either<Error, Internal.t> => {
    return pipe(
        source
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(source => { return { ...source, id: O.some(source.id) }; })
      , E.mapLeft(E.toError)
    );
  };
}
