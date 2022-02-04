import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { Exception, Format } from "magic";

export type Passthrough = {
  putObject: <T>(formatter: Format.JsonFormatter<T>) => (writeFunc: (savedObject: O.Option<T>) => T) => (path: string) => TE.TaskEither<Exception.t, T>;
  getObject: <T>(formatter: Format.JsonFormatter<T>) => (path: string) => TE.TaskEither<Exception.t, T>;
  deleteObject: (path: string) => TE.TaskEither<Exception.t, void>;
}

export class FilePassthrough implements Passthrough {
  public putObject =
    <T>(formatter: Format.JsonFormatter<T>) =>
    (writeFunc: (savedObject: O.Option<T>) => T) =>
    (path: string): TE.TaskEither<Exception.t, T> => {
    return TE.throwError(Exception.throwNotFound);
  }

  public getObject = <T>(formatter: Format.JsonFormatter<T>) => (path: string): TE.TaskEither<Exception.t, T> => {
    return TE.throwError(Exception.throwNotFound);
  }

  public deleteObject = (path: string): TE.TaskEither<Exception.t, void> => {
    return TE.throwError(Exception.throwNotFound);
  }
}
