import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import { optionFromNullable, fromNullable } from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys'

export namespace Internal {
  export type t = {
      id: O.Option<string>
    , groupId: string
    , name: string
  }
}

export namespace Json {
  export const Request = iot.type({
      groupId: iot.string
    , name: iot.string
  });

  export type Request = iot.TypeOf<typeof Request>;

  export const from = (account: any): E.Either<Error, Internal.t> => {
    return pipe(
        account
      , Request.decode
      , E.map(account => { return { ...account, id: O.none }; })
      , E.mapLeft(E.toError)
    );
  }

  export const to = (account: Internal.t): any => {
    const id = pipe(account.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }))

    return {
        ...id
      , groupId: account.groupId
      , name: account.name
    }
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
      , E.map(account => { return { ...account, id: O.some(account.id) }; })
      , E.mapLeft(E.toError)
    );
  }
}
