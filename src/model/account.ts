import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as iot from 'io-ts';
import { optionFromNullable } from 'io-ts-types';

export namespace Internal {
  export const t = iot.type({
    id: optionFromNullable(iot.string),
    groupId: iot.string,
    name: iot.string
  });

  export type t = iot.TypeOf<typeof t>;
}

export namespace Json {
  export const t = iot.type({
    groupId: iot.string,
    name: iot.string
  });

  export type t = iot.TypeOf<typeof t>;

  export const lift = (account: any): E.Either<Error, Internal.t> => {
    return pipe(
      t.decode(account),
      E.map(Internal.t.decode),
      E.flatten,
      E.mapLeft(E.toError)
    );
  }
}

export namespace Database {
  export const t = iot.type({
    id: iot.string,
    groupId: iot.string,
    name: iot.string
  });

  export type t = iot.TypeOf<typeof t>;

  export const lift = (account: any): E.Either<Error, Internal.t> => {
    console.log(account)
    return pipe(
      t.decode(account),
      E.map(x => {
        console.log(x)
        return x
      }),
      E.map(Internal.t.decode),
      E.flatten,
      E.mapLeft(E.toError)
    );
  }
}
