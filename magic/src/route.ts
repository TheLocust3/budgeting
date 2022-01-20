import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';

import * as Exception from './exception'

export const fromQuery = (value: string | string[] | undefined): E.Either<Exception.t, string> => {
  return pipe(
      value
    , iot.string.decode
    , E.mapLeft((_) => Exception.throwBadRequest)
  );
}