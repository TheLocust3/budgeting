import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import camelcaseKeys from 'camelcase-keys'

import * as Transaction from '../model/transaction';

export namespace Internal {
  export namespace Clause {
    export type StringOperator = "Eq" | "Neq"
    export type NumberOperator = "Eq" | "Neq" | "Gt" | "Lt" | "Gte" | "Lte"
    export type Operator = StringOperator | NumberOperator

    export type And = { 
      _type: "And";
      left: t;
      right: t;
    }

    export type Not = {
      _type: "Not";
      clause: t;
    }

    export type StringMatch = { 
      _type: "StringMatch";
      field: Transaction.Internal.Field.StringField;
      operator: StringOperator;
      value: string;
    }

    export type NumberMatch = { 
      _type: "NumberMatch";
      field: Transaction.Internal.Field.NumberField;
      operator: NumberOperator;
      value: number;
    }

    export type t = And | Not | StringMatch | NumberMatch
  }

  export namespace Expression {
    export type Add = {
      _type: "Add";
      left: NumberExpression;
      right: NumberExpression;
    }

    export type Sub = {
      _type: "Sub";
      left: NumberExpression;
      right: NumberExpression;
    }

    export type Mul = {
      _type: "Mul";
      left: NumberExpression;
      right: NumberExpression;
    }

    export type Div = {
      _type: "Div";
      left: NumberExpression;
      right: NumberExpression;
    }

    export type Exp = {
      _type: "Exp";
      term: NumberExpression;
      power: NumberExpression;
    }

    export type Concat = {
      _type: "Concat";
      left: t;
      right: t;
    }

    export type StringReference = {
      _type: "StringReference";
      field: Transaction.Internal.Field.StringField;
    }

    export type NumberReference = {
      _type: "NumberReference";
      field: Transaction.Internal.Field.NumberField;
    }

    export type StringLiteral = {
      _type: "StringLiteral";
      value: string;
    }

    export type NumberLiteral = {
      _type: "NumberLiteral";
      value: number;
    }

    export type NumberExpression = Add | Sub | Mul | Div | Exp | NumberReference | NumberLiteral
    export type StringExpression = Concat | StringReference | StringLiteral

    export type t = NumberExpression | StringExpression
  }

  export type Include = {
    _type: "Include";
    clause: Clause.t;
  }

  export type UpdateString = {
    _type: "UpdateString";
    where: Clause.t;
    field: Transaction.Internal.Field.StringField;
    expression: Expression.StringExpression;
  }

  export type UpdateNumber = {
    _type: "UpdateNumber";
    where: Clause.t;
    field: Transaction.Internal.Field.NumberField;
    expression: Expression.NumberExpression;
  }

  export type Update = UpdateString | UpdateNumber

  export type Rule = Include | Update

  export const collectInclude = (rule: Rule): O.Option<Include> => {
    switch (rule._type) {
      case "Include":
        return O.some(rule);
      case "UpdateString":
        return O.none;
      case "UpdateNumber":
        return O.none;
    }
  }

  export const collectUpdate = (rule: Rule): O.Option<Update> => {
    switch (rule._type) {
      case "Include":
        return O.none;
      case "UpdateString":
        return O.some(rule);
      case "UpdateNumber":
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
    export const StringOperator = iot.union([
        iot.literal("Eq")
      , iot.literal("Neq")
    ]);

    export const NumberOperator = iot.union([
        iot.literal("Eq")
      , iot.literal("Neq")
      , iot.literal("Gt")
      , iot.literal("Lt")
      , iot.literal("Gte")
      , iot.literal("Lte")
    ]);

    export const Operator = iot.union([
        StringOperator
      , NumberOperator
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

    export const StringMatch: iot.Type<Internal.Clause.StringMatch> = iot.type({
        _type: iot.literal("StringMatch")
      , field: Transaction.Json.Field.StringField
      , operator: StringOperator
      , value: iot.string
    });

    export const NumberMatch: iot.Type<Internal.Clause.NumberMatch> = iot.type({
        _type: iot.literal("NumberMatch")
      , field: Transaction.Json.Field.NumberField
      , operator: NumberOperator
      , value: iot.number
    });

    export const t = iot.recursion<Internal.Clause.t>("t", () => iot.union([And, Not, StringMatch, NumberMatch]));
  }

  export namespace Expression {
    export const Add: iot.Type<Internal.Expression.Add> = iot.recursion("NumberExpression", () => iot.type({
        _type: iot.literal("Add")
      , left: NumberExpression
      , right: NumberExpression
    }));

    export const Sub: iot.Type<Internal.Expression.Sub> = iot.recursion("NumberExpression", () => iot.type({
        _type: iot.literal("Sub")
      , left: NumberExpression
      , right: NumberExpression
    }));

    export const Mul: iot.Type<Internal.Expression.Mul> = iot.recursion("NumberExpression", () => iot.type({
        _type: iot.literal("Mul")
      , left: NumberExpression
      , right: NumberExpression
    }));

    export const Div: iot.Type<Internal.Expression.Div> = iot.recursion("NumberExpression", () => iot.type({
        _type: iot.literal("Div")
      , left: NumberExpression
      , right: NumberExpression
    }));

    export const Exp: iot.Type<Internal.Expression.Exp> = iot.recursion("NumberExpression", () => iot.type({
        _type: iot.literal("Exp")
      , term: NumberExpression
      , power: NumberExpression
    }));

    export const Concat: iot.Type<Internal.Expression.Concat> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Concat")
      , left: t
      , right: t
    }));

    export const StringReference = iot.type({
        _type: iot.literal("StringReference")
      , field: Transaction.Json.Field.StringField
    });

    export const NumberReference = iot.type({
        _type: iot.literal("NumberReference")
      , field: Transaction.Json.Field.NumberField
    });

    export const StringLiteral = iot.type({
        _type: iot.literal("StringLiteral")
      , value: iot.string
    });

    export const NumberLiteral = iot.type({
        _type: iot.literal("NumberLiteral")
      , value: iot.number
    });

    export const NumberExpression = iot.recursion<Internal.Expression.NumberExpression>("NumberExpression", () => {
      return iot.union([Add, Sub, Mul, Div, Exp, NumberReference, NumberLiteral])
    });

    export const StringExpression = iot.recursion<Internal.Expression.StringExpression>("StringExpression", () => {
      return iot.union([Concat, StringReference, StringLiteral])
    });

    export const t = iot.recursion<Internal.Expression.t>("t", () => {
      return iot.union([NumberExpression, StringExpression])
    });
  }

  export const Include = iot.type({
      _type: iot.literal("Include")
    , clause: Clause.t
  });

  export const UpdateString = iot.type({
      _type: iot.literal("UpdateString")
    , where: Clause.t
    , field: Transaction.Json.Field.StringField
    , expression: Expression.StringExpression
  });

  export const UpdateNumber = iot.type({
      _type: iot.literal("UpdateNumber")
    , where: Clause.t
    , field: Transaction.Json.Field.NumberField
    , expression: Expression.NumberExpression
  });

  export const Update = iot.union([UpdateString, UpdateNumber])

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
