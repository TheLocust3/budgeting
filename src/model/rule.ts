import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import camelcaseKeys from 'camelcase-keys'

export namespace Internal {
  export type Operator = "Eq" | "Neq" | "Gt" | "Lt" | "Gte" | "Lte"

  export type And = { 
    _type: "And";
    left: Clause;
    right: Clause;
  }

  export type Not = {
    _type: "Not";
    clause: Clause;
  }

  export type Match = { 
    _type: "Match";
    field: string;
    operator: Operator;
    value: string;
  }

  export type Clause = And | Not | Match

  export type Include = {
    _type: "Include";
    clause: Clause;
  }

  export type Rule = Include

  export const collectInclude = (rule: Rule): O.Option<Include> => {
    switch (rule._type) {
      case "Include":
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
  ]);

  export const And: iot.Type<Internal.And> = iot.recursion("Clause", () => iot.type({
      _type: iot.literal("And")
    , left: Clause
    , right: Clause
  }));

  export const Not: iot.Type<Internal.Not> = iot.recursion("Clause", () => iot.type({
      _type: iot.literal("Not")
    , clause: Clause
  }));

  export const Match: iot.Type<Internal.Match> = iot.type({
      _type: iot.literal("Match")
    , field: iot.string
    , operator: Operator
    , value: iot.string
  });

  export const Clause = iot.recursion<Internal.Clause>("Clause", () => iot.union([And, Not, Match]));

  export const Include = iot.type({
      _type: iot.literal("Include")
    , clause: Clause
  });

  export const Rule = Include

  export const Request = iot.type({
      accountId: iot.string
    , rule: Rule
  });

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
    , rule: Json.Rule
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
