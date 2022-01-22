import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import * as types from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys'

import { Exception } from 'magic';

export namespace Internal {
  export type t = {
    id: O.Option<string>;
    userId: string;
    name: string;
  }
}

export namespace Json {
  export const Request = iot.type({
      userId: iot.string
    , name: iot.string
  });

  export const from = (source: any): E.Either<Exception.t, Internal.t> => {
    return pipe(
        source
      , Request.decode
      , E.map((source) => { return { ...source, id: O.none }; })
      , E.mapLeft((_) => Exception.throwMalformedJson)
    );
  }

  export const to = (source: Internal.t): any => {
    const id = pipe(source.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }))

    return {
        ...id
      , userId: source.userId
      , name: source.name
    }
  }
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
  }
}
