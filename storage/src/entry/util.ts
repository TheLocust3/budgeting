import { v5 as uuidv5 } from 'uuid';
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { Passthrough, FilePassthrough } from "./passthrough";

import { Exception } from "magic";

export const rootPath = String(process.env.META);
export const hash = (value: string) => uuidv5(value, uuidv5.URL);
export const passthrough: Passthrough = new FilePassthrough();

export namespace Writers {
  export const orDefaultWriter = <T>(defaultT: T) => (writerFunc: (saved: T) => T) => {
    return (saved: O.Option<T>) => {
      const orDefault = O.match(
          () => defaultT
        , (saved: T) => saved
      )(saved)

      return E.right(writerFunc(orDefault));
    };
  }

  export const overwriteWriter = <T>() => (obj: T) => {
    return (saved: O.Option<T>) => {
      return E.right(obj);
    };
  }
}

export const orNotFound = TE.chain((option: O.Option<any>) => {
  return O.match(
      () => TE.left(Exception.throwNotFound)
    , (some: any) => TE.right(some)
  )(option)
});
