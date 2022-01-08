import { Either, map, flatten } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import * as iot from 'io-ts';
import { optionFromNullable } from 'io-ts-types';

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
    id: optionFromNullable(iot.string),
    rule: iot.union([Select, Attach])
  })
  export type t = iot.TypeOf<typeof t>
}

export namespace Json {
  export const t = iot.type({
    rule: iot.union([Internal.Select, Internal.Attach])
  })
  export type t = iot.TypeOf<typeof t>  

  export const lift = (rule: any): Either<iot.Errors, Internal.t> => {
    return pipe(
      t.decode(rule),
      map(Internal.t.decode),
      flatten
    );
  }
}
