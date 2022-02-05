import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Passthrough } from "./passthrough";

import { Exception, Format } from "magic";

type Config<T> = {
  root: string;
  name: string;
  format: Format.JsonFormatter<T>;
}

type Writer<T> = (savedObject: O.Option<T>) => E.Either<Exception.t, T>;

export class Entry<T> {
  constructor(private readonly passthrough: Passthrough, private readonly config: Config<T>) {}

  public getObject = (id: string): TE.TaskEither<Exception.t, T> => {
    return pipe(
        this.pathFor(id)
      , this.passthrough.getObject
      , TE.chain((obj) => pipe(obj, this.config.format.from, TE.fromEither))
    );
  }

  public putObject = (id: string) => (writer: Writer<T>) : TE.TaskEither<Exception.t, T> => {
    const anyWriter = (obj: any) => {
      return O.match(
          () => writer(O.none)
        , (obj) => {
            return pipe(
                obj
              , this.config.format.from
              , E.chain((obj) => writer(O.some(obj)))
              , E.map(this.config.format.to)
            );
          }
      )(obj);
    }

    return pipe(
        this.pathFor(id)
      , this.passthrough.putObject(anyWriter)
    );
  }

  public listObjects = () : TE.TaskEither<Exception.t, string[]> => {
    return pipe(
        this.config.root
      , this.passthrough.listObjects
    );
  }

  private pathFor = (id: string) => `${this.config.root}/${id}/${this.config.name}.json`;
}
