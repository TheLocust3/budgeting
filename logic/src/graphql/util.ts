import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Exception } from "magic";

export const passthroughResolver = (parent: any) => { return parent; }

export const toPromise = <T>(task: TE.TaskEither<Exception.t, T>): Promise<T> => {
  return TE.match(
      (error: Exception.t) => { throw new Error(error._type) }
    , (out: T) => out
  )(task)();
}