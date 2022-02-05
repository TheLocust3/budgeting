import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { Exception, Format } from "magic";

type Writer = (savedObject: O.Option<any>) => E.Either<Exception.t, any>;

export type Passthrough = {
  putObject: (writeFunc: Writer) => (path: string) => TE.TaskEither<Exception.t, any>;
  getObject: (path: string) => TE.TaskEither<Exception.t, any>;
  deleteObject: (path: string) => TE.TaskEither<Exception.t, void>;
}

export class FilePassthrough implements Passthrough {
  public putObject =
    (writeFunc: Writer) =>
    (path: string): TE.TaskEither<Exception.t, any> => {
    return TE.throwError(Exception.throwNotFound);
  }

  public getObject = (path: string): TE.TaskEither<Exception.t, any> => {
    return TE.throwError(Exception.throwNotFound);
  }

  public deleteObject = (path: string): TE.TaskEither<Exception.t, void> => {
    return TE.throwError(Exception.throwNotFound);
  }
}
