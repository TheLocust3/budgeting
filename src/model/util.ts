import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as t from 'io-ts';
import * as types from 'io-ts-types';

export const fromQuery = (value: string | string[] | undefined): E.Either<Error, string> => {
  return pipe(
      value
    , t.string.decode
    , E.mapLeft(E.toError)
  );
}

export function withLazyDefault<T extends t.Mixed>(
  type: T,
  defaultValue: () => t.TypeOf<T>
): t.Type<t.TypeOf<T>, t.TypeOf<T>, unknown> {
  return new t.Type(
    `withLazyDefault(${type.name})`,
    type.is,
    (v) => type.decode(v != null ? v : defaultValue()),
    type.encode
  )
}

export interface OptionToNullableC<C extends t.Mixed>
  extends t.Type<O.Option<t.TypeOf<C>>, O.Option<t.TypeOf<C>>, unknown> {}

export function optionToNullable<C extends t.Mixed>(
  codec: C,
  name: string = `Option<${codec.name}>`
): OptionToNullableC<C> {
  return new t.Type(
    name,
    types.option(codec).is,
    types.option(codec).decode,
    a =>
      O.toNullable(
        pipe(
          a,
          O.map(codec.encode)
        )
      )
  )
}
