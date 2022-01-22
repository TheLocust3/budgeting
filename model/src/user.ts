import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import * as types from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys'

import { Exception } from 'magic';

export namespace Internal {
  export type t = {
    id: string;
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
      , E.map((user) => { return { ...user, id: "" }; })
      , E.mapLeft((_) => Exception.throwMalformedJson)
    );
  }

  export const to = (user: Internal.t): any => {
    return {
        id: user.id
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
      , E.map(user => { return { ...user, id: user.id }; })
      , E.mapLeft(E.toError)
    );
  }
}
