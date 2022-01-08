import * as t from 'io-ts';

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
