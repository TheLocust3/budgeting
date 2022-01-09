import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import * as types from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys'

import { optionToNullable } from './util';

export namespace Internal {
  export type PlaidMetadata = {
    _type: "Plaid";
  }

  export type t = {
    id: O.Option<string>;
    sourceId: string;
    amount: number;
    merchantName: string;
    description: string;
    authorizedAt: Date;
    capturedAt: O.Option<Date>;
    metadata: PlaidMetadata;
  }
}

export namespace Json {
  export const PlaidMetadata = iot.type({
    _type: iot.literal("Plaid")
  })

  export const Request = iot.type({
      sourceId: iot.string
    , amount: iot.number
    , merchantName: iot.string
    , description: iot.string
    , authorizedAt: types.DateFromUnixTime
    , capturedAt: types.optionFromNullable(types.DateFromUnixTime)
    , metadata: PlaidMetadata
  });

  export type Request = iot.TypeOf<typeof Request>;

  export const from = (transaction: any): E.Either<Error, Internal.t> => {
    return pipe(
        transaction
      , Request.decode
      , E.map(transaction => { return { ...transaction, id: O.none }; })
      , E.mapLeft(E.toError)
    );
  }

  export const to = (transaction: Internal.t): any => {
    const id = pipe(transaction.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }))
    const capturedAt = pipe(
        transaction.capturedAt
      , O.map(capturedAt => { return { capturedAt: capturedAt.getTime() }; })
      , O.getOrElse(() => { return {}; })
    )

    return {
        ...id
      , sourceId: transaction.sourceId
      , amount: transaction.amount
      , merchantName: transaction.merchantName
      , description: transaction.description
      , authorizedAt: transaction.authorizedAt.getTime()
      , ...capturedAt
      , metadata: transaction.metadata
    }
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
    , metadata: Json.PlaidMetadata
  })
  export type t = iot.TypeOf<typeof t>

  export const lift = (transaction: any): E.Either<Error, Internal.t> => {
    return pipe(
        transaction
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(transaction => { return { ...transaction, id: O.some(transaction.id) }; })
      , E.mapLeft(E.toError)
    );
  }
}
