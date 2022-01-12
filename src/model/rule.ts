import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import camelcaseKeys from 'camelcase-keys'

export namespace Internal {
  export namespace Clause {
    export type Operator = "Eq" | "Neq" | "Gt" | "Lt" | "Gte" | "Lte"

    export type And = { 
      _type: "And";
      left: t;
      right: t;
    }

    export type Not = {
      _type: "Not";
      clause: t;
    }

    export type Match = { 
      _type: "Match";
      field: string;
      operator: Operator;
      value: string;
    }

    export type t = And | Not | Match
  }

  export namespace Expression {
    export type Add = {
      _type: "Add";
      left: t;
      right: t;
    }

    export type Sub = {
      _type: "Sub";
      left: t;
      right: t;
    }

    export type Mul = {
      _type: "Mul";
      left: t;
      right: t;
    }

    export type Div = {
      _type: "Div";
      left: t;
      right: t;
    }

    export type Exp = {
      _type: "Exp";
      term: t;
      power: t;
    }

    export type Concat = {
      _type: "Concat";
      left: t;
      right: t;
    }

    export type Reference = {
      _type: "Reference";
      field: string;
    }

    export type Literal = {
      _type: "Literal";
      value: string;
    }

    export type t = Add | Sub | Mul | Div | Exp | Reference | Concat | Literal
  }

  export type Include = {
    _type: "Include";
    clause: Clause.t;
  }

  export type Update = {
    _type: "Update";
    where: Clause.t;
    field: string;
    expression: Expression.t;
  }

  export type Rule = Include | Update

  export const collectInclude = (rule: Rule): O.Option<Include> => {
    switch (rule._type) {
      case "Include":
        return O.some(rule);
      case "Update":
        return O.none;
    }
  }

  export const collectUpdate = (rule: Rule): O.Option<Update> => {
    switch (rule._type) {
      case "Include":
        return O.none;
      case "Update":
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
  export namespace Clause {
    export const Operator = iot.union([
        iot.literal("Eq")
      , iot.literal("Neq")
      , iot.literal("Gt")
      , iot.literal("Lt")
      , iot.literal("Gte")
      , iot.literal("Lte")
    ]);

    export const And: iot.Type<Internal.Clause.And> = iot.recursion("t", () => iot.type({
        _type: iot.literal("And")
      , left: t
      , right: t
    }));

    export const Not: iot.Type<Internal.Clause.Not> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Not")
      , clause: t
    }));

    export const Match: iot.Type<Internal.Clause.Match> = iot.type({
        _type: iot.literal("Match")
      , field: iot.string
      , operator: Operator
      , value: iot.string
    });

    export const t = iot.recursion<Internal.Clause.t>("t", () => iot.union([And, Not, Match]));
  }

  export namespace Expression {
    export const Add: iot.Type<Internal.Expression.Add> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Add")
      , left: t
      , right: t
    }));

    export const Sub: iot.Type<Internal.Expression.Sub> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Sub")
      , left: t
      , right: t
    }));

    export const Mul: iot.Type<Internal.Expression.Mul> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Mul")
      , left: t
      , right: t
    }));

    export const Div: iot.Type<Internal.Expression.Div> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Div")
      , left: t
      , right: t
    }));

    export const Exp: iot.Type<Internal.Expression.Exp> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Exp")
      , term: t
      , power: t
    }));

    export const Concat: iot.Type<Internal.Expression.Concat> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Concat")
      , left: t
      , right: t
    }));

    export const Reference = iot.type({
        _type: iot.literal("Reference")
      , field: iot.string
    });

    export const Literal = iot.type({
        _type: iot.literal("Literal")
      , value: iot.string
    });

    export const t = iot.recursion<Internal.Expression.t>("t", () => {
      return iot.union([Add, Sub, Mul, Div, Exp, Reference, Concat, Literal])
    });
  }

  export const Include = iot.type({
      _type: iot.literal("Include")
    , clause: Clause.t
  });

  export const Update = iot.type({
      _type: iot.literal("Update")
    , where: Clause.t
    , field: iot.string
    , expression: Expression.t
  });

  export const Rule = iot.union([Include, Update])

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
