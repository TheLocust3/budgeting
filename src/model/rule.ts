import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as iot from 'io-ts';
import { optionFromNullable } from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys'

export namespace Internal {
  export const Select = iot.type({
    _type: iot.literal("Select")
  })
  export type Select = iot.TypeOf<typeof Select>

  export const Attach = iot.type({
    _type: iot.literal("Attach")
  })
  export type Attach = iot.TypeOf<typeof Attach>

  export const t = iot.type({
      id: optionFromNullable(iot.string)
    , accountId: iot.string
    , rule: iot.union([Select, Attach])
  })
  export type t = iot.TypeOf<typeof t>
}

export namespace Json {
  export const t = iot.type({
      accountId: iot.string
    , rule: iot.union([Internal.Select, Internal.Attach])
  })
  export type t = iot.TypeOf<typeof t>  

  export const lift = (accountId: string) => (rule: any): E.Either<Error, Internal.t> => {
    return pipe(
        { ...rule, accountId }
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
    , account_id: iot.string
    , rule: iot.union([Internal.Select, Internal.Attach])
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
