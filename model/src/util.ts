import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Exception } from "magic";

export class JSONFormatter<T> {
    constructor(private readonly type: iot.Type<T>) {}

    public from = (json: any): E.Either<Exception.t, T> => {
      return pipe(
          json
        , this.type.decode
        , E.mapLeft((_) => Exception.throwMalformedJson)
      ); 
    }

    public to = (obj: T): any => {
      return pipe(
          obj
        , this.type.encode
      ); 
    }
  }

export namespace JSON {
  export const from = <T>(decoder: (json: any) => iot.Validation<T>) => (json: any): E.Either<Exception.t, T> => {
    return pipe(
        decoder(json)
      , E.mapLeft((_) => Exception.throwMalformedJson)
    );
  }
}
