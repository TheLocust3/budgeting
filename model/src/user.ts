import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";
import camelcaseKeys from "camelcase-keys";

import { JSONFormatter, JSON } from "./util";

import { Exception } from "magic";

export namespace Internal {
  export type t = {
    id: string;
    email: string;
    password: string;
    role: string;
  }
}

export namespace Frontend {
  export namespace Request {
    export namespace Credentials {
      const t = iot.type({
          email: iot.string
        , password: iot.string
      });
      
      export type t = iot.TypeOf<typeof t>
      export const JSON = new JSONFormatter(t);
    }
  }

  export namespace Response {
    export namespace Token {
      const t = iot.type({
        token: iot.string
      });
      type t = iot.TypeOf<typeof t>

      export const toJson = (response: t): any => {
        return {
          token: response
        };
      };
    }
  }
}

export namespace Json {
  export const Request = iot.type({
      email: iot.string
    , password: iot.string
  });

  export const from = (user: any): E.Either<Exception.t, Internal.t> => {
    return pipe(
        user
      , Request.decode
      , E.map((user) => { return { ...user, id: "", role: "user" }; })
      , E.mapLeft((_) => Exception.throwMalformedJson)
    );
  };

  export const to = (user: Internal.t): any => {
    return {
        id: user.id
      , email: user.email
      , password: user.password
    };
  };
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , email: iot.string
    , password: iot.string
    , role: iot.string
  });

  export const from = (user: any): E.Either<Error, Internal.t> => {
    return pipe(
        user
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(user => { return { ...user, id: user.id }; })
      , E.mapLeft(E.toError)
    );
  };
}
