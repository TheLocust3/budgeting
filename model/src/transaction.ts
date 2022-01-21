import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import * as types from 'io-ts-types';
import camelcaseKeys from 'camelcase-keys';

import { Exception } from 'magic';

export namespace Internal {
  export type t = {
    id: O.Option<string>;
    sourceId: string;
    userId: string;
    amount: number;
    merchantName: string;
    description: string;
    authorizedAt: Date;
    capturedAt: O.Option<Date>;
    metadata: object;
    custom: { [key: string]: string[] };
  }
}

export namespace Materialize {
  export type t = {
    id: string;
    sourceId: string;
    userId: string;
    amount: number;
    merchantName: string;
    description: string;
    authorizedAt: number;
    capturedAt: O.Option<number>;
    metadata: object;
    custom: { [key: string]: string[] };
  }

  export namespace Field {
    export type NumberField = "amount" | "authorizedAt" | "capturedAt";
    export type OptionNumberField = "capturedAt";
    export type StringField = "id" | "sourceId" | "userId" | "merchantName" | "description";

    export type t = NumberField | StringField;
  }

  export const from = (transaction: Internal.t): t => {
    const id = pipe(
        transaction.id
      , O.getOrElse(() => "")
    )

    return {
        id: id
      , sourceId: transaction.sourceId
      , userId: transaction.userId
      , amount: transaction.amount
      , merchantName: transaction.merchantName
      , description: transaction.description
      , authorizedAt: transaction.authorizedAt.getTime()
      , capturedAt: O.map((capturedAt: Date) => capturedAt.getTime())(transaction.capturedAt)
      , metadata: transaction.metadata
      , custom: {}
    }
  }

  export const to = (transaction: t): Internal.t => {
    return {
        id: O.some(transaction.id)
      , sourceId: transaction.sourceId
      , userId: transaction.userId
      , amount: transaction.amount
      , merchantName: transaction.merchantName
      , description: transaction.description
      , authorizedAt: new Date(transaction.authorizedAt)
      , capturedAt: O.map((capturedAt: number) => new Date(capturedAt))(transaction.capturedAt)
      , metadata: transaction.metadata
      , custom: transaction.custom
    }
  }
}

export namespace Json {

  export const Request = iot.type({
      sourceId: iot.string
    , userId: iot.string
    , amount: iot.number
    , merchantName: iot.string
    , description: iot.string
    , authorizedAt: iot.number
    , capturedAt: types.optionFromNullable(iot.number)
    , metadata: iot.object
  });

  export namespace Field {
    export const NumberField: iot.Type<Materialize.Field.NumberField> = iot.union([
        iot.literal("amount")
      , iot.literal("authorizedAt")
      , iot.literal("capturedAt")
    ]);

    export const OptionNumberField: iot.Type<Materialize.Field.OptionNumberField> = iot.literal("capturedAt")

    export const StringField: iot.Type<Materialize.Field.StringField> = iot.union([
        iot.literal("id")
      , iot.literal("sourceId")
      , iot.literal("userId")
      , iot.literal("merchantName")
      , iot.literal("description")
    ]);

    export const t: iot.Type<Materialize.Field.t> = iot.union([
        NumberField
      , StringField
    ]);
  }

  export const from = (transaction: any): E.Either<Exception.t, Internal.t> => {
    return pipe(
        transaction
      , Request.decode
      , E.map(transaction => {
          const capturedAt = O.map((capturedAt: number) => new Date(capturedAt))(transaction.capturedAt);
          return { ...transaction, id: O.none, authorizedAt: new Date(transaction.authorizedAt), capturedAt: capturedAt, custom: {} };
        })
      , E.mapLeft((_) => Exception.throwMalformedJson)
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
      , userId: transaction.userId
      , amount: transaction.amount
      , merchantName: transaction.merchantName
      , description: transaction.description
      , authorizedAt: transaction.authorizedAt.getTime()
      , ...capturedAt
      , metadata: transaction.metadata
      , custom: transaction.custom
    }
  }
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , source_id: iot.string
    , user_id: iot.string
    , amount: types.NumberFromString
    , merchant_name: iot.string
    , description: iot.string
    , authorized_at: types.date
    , captured_at: types.optionFromNullable(types.date)
    , metadata: iot.object
  })

  export const from = (transaction: any): E.Either<Error, Internal.t> => {
    return pipe(
        transaction
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(transaction => { return { ...transaction, id: O.some(transaction.id), custom: {} }; })
      , E.mapLeft(E.toError)
    );
  }
}
