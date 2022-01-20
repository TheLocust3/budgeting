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
    email: string;
    password: string;
  }
}

export namespace Json {
  export const Request = iot.type({
      email: iot.string
    , password: iot.string
  });

  export const from = (user: any): E.Either<Exception.t, Internal.t> => {
    return pipe(
        user
      , Request.decode
      , E.map((user) => { return { ...user, id: O.none }; })
      , E.mapLeft((_) => Exception.throwMalformedJson)
    );
  }

  export const to = (user: Internal.t): any => {
    const id = pipe(user.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }))

    return {
        ...id
      , email: user.email
      , password: user.password
    }
  }
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , email: iot.string
    , password: iot.string
  });

  export const from = (user: any): E.Either<Error, Internal.t> => {
    return pipe(
        user
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(user => { return { ...user, id: O.some(user.id) }; })
      , E.mapLeft(E.toError)
    );
  }
}
