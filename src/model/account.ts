import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import { optionFromNullable, fromNullable } from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys'

export namespace Internal {
  export const t = iot.type({
      id: optionFromNullable(iot.string)
    , groupId: iot.string
    , name: iot.string
  });

  export type t = iot.TypeOf<typeof t>;
}

export namespace Json {
  export const t = iot.type({
    name: iot.string
  });

  export type t = iot.TypeOf<typeof t>;

  export const lift = (groupId: string) => (account: any): E.Either<Error, Internal.t> => {
    return pipe(
        { ...account, groupId }
      , t.decode
      , E.map(Internal.t.decode)
      , E.flatten
      , E.mapLeft(E.toError)
    );
  }
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , group_id: iot.string
    , name: iot.string
  });

  export type t = iot.TypeOf<typeof t>;

  export const lift = (account: any): E.Either<Error, Internal.t> => {
    return pipe(
        account
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(Internal.t.decode)
      , E.flatten
      , E.mapLeft(E.toError)
    );
  }
}
