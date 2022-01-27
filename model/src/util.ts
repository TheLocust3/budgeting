import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception } from "magic";

export type Formatter<T> = {
  from: (json: any) => E.Either<Exception.t, T>;
  to: (obj: T) => any;
}

export class JsonFormatter<T> implements Formatter<T> {
  constructor(private readonly type: iot.Type<T>) {}

  public from = (json: any): E.Either<Exception.t, T> => {
    return pipe(
        json
      , this.type.decode
      , E.mapLeft((_) => Exception.throwMalformedJson)
    ); 
  }

  public to = (obj: T): any => {
    return this.type.encode(obj);
  }
}
