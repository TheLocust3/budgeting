import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import camelcaseKeys from 'camelcase-keys'

export namespace Internal {
  export type t = {
    id: O.Option<string>,
    name: string
  }
}

export namespace Json {
  export const Request = iot.type({
    name: iot.string
  });

  export const from = (group: any): E.Either<Error, Internal.t> => {
    return pipe(
        group
      , Request.decode
      , E.map(group => { return { ...group, id: O.none }; })
      , E.mapLeft(E.toError)
    );
  }

  export const to = (group: Internal.t): any => {
    const id = pipe(group.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }))

    return {
        ...id
      , name: group.name
    }
  }
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , name: iot.string
  });

  export const from = (group: any): E.Either<Error, Internal.t> => {
    return pipe(
        group
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(group => { return { ...group, id: O.some(group.id) }; })
      , E.mapLeft(E.toError)
    );
  }
}
