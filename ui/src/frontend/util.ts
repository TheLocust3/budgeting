import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import { pipe } from "fp-ts/lib/pipeable";

export namespace Cookie {
  export const get = (key: string) => {
    return pipe(
        document.cookie.split(";")
      , A.filterMap((cookie) => {
          const [cookieKey, cookieValue] = cookie.split("=");
          if (cookieKey.replace(" ", "") === key) {
            return O.some(cookieValue);
          } else {
            return O.none;
          }
        })
      , A.head
    );
  }

  export const set = (key: string, value: string) => {
    document.cookie = `${key}=${value}`;
  }
}

export const token = O.match(() => "", (token: string) => token)(Cookie.get("token"))
