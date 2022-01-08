import { Either, map, flatten } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as iot from 'io-ts';
import { optionFromNullable } from 'io-ts-types';

export namespace Internal {
  export const t = iot.type({
    id: optionFromNullable(iot.string),
    groupId: iot.string,
    name: iot.string
  })

  export type t = iot.TypeOf<typeof t>
}

export namespace Json {
  export const t = iot.type({
    groupId: iot.string,
    name: iot.string
  })

  export type t = iot.TypeOf<typeof t>  

  export const lift = (account: any): Either<iot.Errors, Internal.t> => {
    return pipe(
      t.decode(account),
      map(Internal.t.decode),
      flatten
    );
  }
}
