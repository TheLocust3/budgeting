import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';

export const fromQuery = (value: string | string[] | undefined): E.Either<Error, string> => {
  return pipe(
      value
    , iot.string.decode
    , E.mapLeft(E.toError)
  );
}

export namespace Array {
  export const flattenOption = <T>(arr: O.Option<T>[]): T[] => {
    return pipe(
        arr
      , A.map(O.match(() => [], (x) => [x]))
      , A.flatten
    );
  }
}
