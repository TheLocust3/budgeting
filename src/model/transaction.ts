import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import * as types from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys'

import { optionToNullable } from './util';

export namespace Internal {
  export const PlaidMetadata = iot.type({
    _type: iot.literal("Plaid")
  })

  export const t = iot.type({
      id: types.optionFromNullable(iot.string)
    , sourceId: iot.string
    , amount: iot.number
    , merchantName: iot.string
    , description: iot.string
    , authorizedAt: types.date
    , capturedAt: optionToNullable(types.date)
    , metadata: PlaidMetadata
  })
  export type t = iot.TypeOf<typeof t>
}

export namespace Json {
  export const t = iot.type({
      sourceId: iot.string
    , amount: iot.number
    , merchantName: iot.string
    , description: iot.string
    , authorizedAt: types.DateFromUnixTime
    , capturedAt: types.optionFromNullable(types.DateFromUnixTime)
    , metadata: Internal.PlaidMetadata
  })
  export type t = iot.TypeOf<typeof t>

  export const lift = (transaction: any): E.Either<Error, Internal.t> => {
    return pipe(
        transaction
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
    , source_id: iot.string
    , amount: types.NumberFromString
    , merchant_name: iot.string
    , description: iot.string
    , authorized_at: types.date
    , captured_at: types.optionFromNullable(types.date)
    , metadata: Internal.PlaidMetadata
  })
  export type t = iot.TypeOf<typeof t>

  export const lift = (transaction: any): E.Either<Error, Internal.t> => {
    return pipe(
        transaction
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(Internal.t.decode)
      , E.flatten
      , E.mapLeft(E.toError)
    );
  }
}
