import * as O from "fp-ts/Option";

export namespace Cookie {
  export const get = (key: string) => {
    return O.none;
  }

  export const set = (key: string, value: string) => {
    return;
  }
}
