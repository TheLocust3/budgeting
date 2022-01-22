import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";
import * as types from "io-ts-types";
import camelcaseKeys from "camelcase-keys";

import * as Rule from "./rule";
import { Exception } from "magic";

export namespace Internal {
  export type t = {
    id: O.Option<string>;
    parentId: O.Option<string>;
    userId: string;
    name: string;
    rules: Rule.Internal.t[];
    children: string[];
  }
}

export namespace Json {
  export const Request = iot.type({
      parentId: types.optionFromNullable(iot.string)
    , userId: iot.string
    , name: iot.string
  });

  export const from = (account: any): E.Either<Exception.t, Internal.t> => {
    return pipe(
        account
      , Request.decode
      , E.map((account) => { return { ...account, id: O.none, rules: [], children: [] }; })
      , E.mapLeft((_) => Exception.throwMalformedJson)
    );
  };

  export const to = (account: Internal.t): any => {
    const id = pipe(account.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }));

    return {
        ...id
      , userId: account.userId
      , name: account.name
    };
  };
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , parent_id: types.optionFromNullable(iot.string)
    , user_id: iot.string
    , name: iot.string
  });

  export const from = (account: any): E.Either<Error, Internal.t> => {
    return pipe(
        account
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(account => { return { ...account, id: O.some(account.id), rules: [], children: [] }; })
      , E.mapLeft(E.toError)
    );
  };
}
