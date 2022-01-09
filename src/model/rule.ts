import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import camelcaseKeys from 'camelcase-keys'

export namespace Internal {
  export type Operator = "Eq" | "Neq" | "Gt" | "Lt" | "Gte" | "Lte" | "Regex"

  export type Select = {
    _type: "Select";
    operator: Operator;
    field: string;
    matches: string;
  }

  export type Attach = {
    _type: "Attach";
  }

  export type Rule = Select | Attach

  export const collectSelect = (rule: Rule): O.Option<Select> => {
    switch (rule._type) {
      case "Select":
        return O.some(rule);
      case "Attach":
        return O.none;
    }
  }

  export const collectAttach = (rule: Rule): O.Option<Attach> => {
    switch (rule._type) {
      case "Select":
        return O.none;
      case "Attach":
        return O.some(rule);
    }
  }

  export type t = {
    id: O.Option<string>;
    accountId: string;
    rule: Rule;
  }
}

export namespace Json {
  export const Operator = iot.union([
      iot.literal("Eq")
    , iot.literal("Neq")
    , iot.literal("Gt")
    , iot.literal("Lt")
    , iot.literal("Gte")
    , iot.literal("Lte")
    , iot.literal("Regex")
  ])

  export const Select = iot.type({
      _type: iot.literal("Select")
    , operator: Operator
    , field: iot.string
    , matches: iot.string
  })

  export const Attach = iot.type({
    _type: iot.literal("Attach")
  })

  export const Request = iot.type({
      accountId: iot.string
    , rule: iot.union([Select, Attach])
  })

  export const from = (rule: any): E.Either<Error, Internal.t> => {
    return pipe(
        rule
      , Request.decode
      , E.map(rule => { return { ...rule, id: O.none }; })
      , E.mapLeft(E.toError)
    );
  }

  export const to = (rule: Internal.t): any => {
    const id = pipe(rule.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }))

    return {
        ...id
      , accountId: rule.accountId
      , rule: rule.rule
    }
  }
}

export namespace Database {
  export const t = iot.type({
      id: iot.string
    , account_id: iot.string
    , rule: iot.union([Json.Select, Json.Attach])
  });

  export const from = (rule: any): E.Either<Error, Internal.t> => {
    return pipe(
        rule
      , t.decode
      , E.map(camelcaseKeys)
      , E.map(rule => { return { ...rule, id: O.some(rule.id) }; })
      , E.mapLeft(E.toError)
    );
  }
}
