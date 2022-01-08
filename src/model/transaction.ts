import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as iot from 'io-ts';
import { DateFromUnixTime, optionFromNullable } from 'io-ts-types';

export namespace Internal {
  export const t = iot.type({
    id: optionFromNullable(iot.string),
    sourceId: iot.string,
    amount: iot.number,
    merchantName: iot.string,
    description: iot.string,
    authorizedAt: iot.number,
    capturedAt: optionFromNullable(DateFromUnixTime)
  })
  export type t = iot.TypeOf<typeof t>
}

export namespace Json {
  export const t = iot.type({
    sourceId: iot.string,
    amount: iot.number,
    merchantName: iot.string,
    description: iot.string,
    authorizedAt: iot.number,
    capturedAt: optionFromNullable(DateFromUnixTime)
  })
  export type t = iot.TypeOf<typeof t>

  export const lift = (transaction: any): E.Either<Error, Internal.t> => {
    return pipe(
      t.decode(transaction),
      E.map(Internal.t.decode),
      E.flatten,
      E.mapLeft(E.toError)
    );
  }
}
