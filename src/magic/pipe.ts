import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";

import * as Exception from "./exception";

export const flattenOption = <T>(arr: O.Option<T>[]): T[] => {
  return pipe(
      arr
    , A.map(O.match(() => [], (x) => [x]))
    , A.flatten
  );
};

export const orElse = <T>(elseOpt: () => O.Option<T>) => (opt: O.Option<T>): O.Option<T> => {
  return O.fold(
      () => elseOpt()
    , (value: T) => O.some(value)
  )(opt)
}

export const toPromise = <T>(task: TE.TaskEither<Exception.t, T>): Promise<T> => {
  return TE.match(
      (error: Exception.t) => { throw new Error(error._type) }
    , (out: T) => out
  )(task)();
}

export const fromPromise = <T>(promise: Promise<T>): TE.TaskEither<Exception.t, T> => {
  return TE.tryCatch(
      () => promise
    , (error) => {
        console.log(error);
        return Exception.throwInternalError;
      }
  );
}
