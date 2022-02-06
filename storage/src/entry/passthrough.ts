import fs, { FileHandle } from "fs/promises";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

import { Exception, Format } from "magic";

type Writer = (savedObject: O.Option<any>) => E.Either<Exception.t, any>;

export type Passthrough = {
  putObject: (writeFunc: Writer) => (path: string) => TE.TaskEither<Exception.t, any>;
  getObject: (path: string) => TE.TaskEither<Exception.t, any>;
  listObjects: (path: string) => TE.TaskEither<Exception.t, string[]>;
}

export class FilePassthrough implements Passthrough {
  transaction = <T>(path: string, mode: string, callback: (handle: FileHandle) => TE.TaskEither<Exception.t, T>): TE.TaskEither<Exception.t, T> => {
    return pipe(
        TE.Do
      , TE.bind("handle", () => TE.tryCatch(
            () => fs.open(path, mode)
          , (error: any) => {
              console.log(error);
              if (error.code == "ENOENT") {
                return Exception.throwNotFound;
              } else {
                return Exception.throwInternalError;  
              }
            }
        ))
      , TE.bind("out", ({ handle }) => callback(handle))
      , TE.map(({ handle, out }) => {
          handle.close();
          return out;
        })
    );
  }

  read = (handle: FileHandle): TE.TaskEither<Exception.t, O.Option<string>> => {
    return pipe(
        TE.tryCatch(
            () => handle.readFile({ encoding: "utf8" })
          , (error) => {
              console.log(error);
              return Exception.throwInternalError;
            }
        )
      , TE.chain((contents) => {
        console.log("TESTESTEST")
        console.log(contents)
          if (contents === "" || contents === undefined || contents === null) {
            return TE.of(O.none);
          } else {
            return TE.of(O.some(contents));
          }
      })
    );
  }

  parse = (json: TE.TaskEither<Exception.t, O.Option<string>>): TE.TaskEither<Exception.t, O.Option<any>> => {
    return pipe(
        json
      , TE.chain((json) => {
          return pipe(
              E.tryCatch(
                  () => O.map(JSON.parse)(json)
                , (error) => {
                    console.log(error)
                    return Exception.throwMalformedJson;
                  }
              )
            , TE.fromEither
          );
        })
    );
  }

  orNotFound = (task: TE.TaskEither<Exception.t, O.Option<any>>): TE.TaskEither<Exception.t, any> => {
    return pipe(
        task
      , TE.chain(O.match(
            () => TE.throwError(Exception.throwNotFound)
          , (obj: any) => TE.of(obj)
        ))
    );
  }

  save = (handle: FileHandle) => (obj: TE.TaskEither<Exception.t, any>): TE.TaskEither<Exception.t, void> => {
    return pipe(
        obj
      , TE.map(JSON.stringify)
      , TE.chain((obj) => {
        console.log("PLSPLSPLS")
        console.log(obj)
          return TE.tryCatch(
              async () => {
                await handle.writeFile(obj, { encoding: "utf8" })
                return;
              }
            , (error) => {
                console.log(error)
                return Exception.throwInternalError;
              }
          );
        })
    );
  }

  mkPath = (path: string): TE.TaskEither<Exception.t, void> => {
    const directoryPath = A.dropRight(1)(path.split("/")).join("/"); // JK: sort of hacky

    return pipe(
        TE.tryCatch(
            () => fs.mkdir(directoryPath, { recursive: true })
          , (error) => {
              console.log(error);
              return Exception.throwInternalError;
            }
        )
      , TE.map(() => {})
    );
  }

  public putObject =
    (writeFunc: Writer) =>
    (path: string): TE.TaskEither<Exception.t, any> => {
    console.log(`[FilePassthrough] - putObject "${path}"`);

    const callback = (handle: FileHandle) => {
      return pipe(
          this.read(handle)
        , this.parse
        , TE.chain((saved) => pipe(writeFunc(saved), TE.fromEither))
        , this.save(handle)
      );
    }

    return pipe(
        this.mkPath(path)
      , TE.chain(() => this.transaction(path, "w+", callback))
    );
  }

  public getObject = (path: string): TE.TaskEither<Exception.t, any> => {
    console.log(`[FilePassthrough] - getObject "${path}"`);

    return this.transaction(path, "r", (handle) => pipe(this.read(handle), this.parse, this.orNotFound));
  }

  public listObjects = (path: string): TE.TaskEither<Exception.t, string[]> => {
    console.log(`[FilePassthrough] - listObjects "${path}"`);

    return TE.tryCatch(
        () => fs.readdir(path)
      , (error) => {
          console.log(error)
          return Exception.throwInternalError;
        }
    );
  }
}
