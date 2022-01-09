import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';

export const fromQuery = (value: string | string[] | undefined): E.Either<Error, string> => {
  return pipe(
      value
    , iot.string.decode
    , E.mapLeft(E.toError)
  );
}
