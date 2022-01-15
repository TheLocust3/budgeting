import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import * as types from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys'

import * as Rule from './rule';
import { throwMalformedJson, Exception } from '../exception';

export namespace Internal {
  export type t = {
      id: O.Option<string>
    , parentId: O.Option<string>
    , name: string
    , rules: Rule.Internal.t[]
  }
}

export namespace Json {
  export const Request = iot.type({
      parentId: types.optionFromNullable(iot.string)
    , name: iot.string
  });

  export const from = (account: any): E.Either<Exception, Internal.t> => {
    return pipe(
        account
      , Request.decode
      , E.map((account) => { return { ...account, id: O.none, rules: [] }; })
      , E.mapLeft((_) => throwMalformedJson)
    );
  }

  export const to = (account: Internal.t): any => {
    const id = pipe(account.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }))

    return {
        ...id
      , name: account.name
    }
  }
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , parent_id: types.optionFromNullable(iot.string)
    , name: iot.string
  });

  export const from = (account: any): E.Either<Error, Internal.t> => {
    return pipe(
        account
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(account => { return { ...account, id: O.some(account.id), rules: [] }; })
      , E.mapLeft(E.toError)
    );
  }
}
