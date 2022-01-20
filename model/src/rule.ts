import { pipe } from 'fp-ts/lib/pipeable';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as iot from 'io-ts';
import camelcaseKeys from 'camelcase-keys'

import * as Transaction from './transaction';
import { Exception } from 'magic';

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
      field: Transaction.Materialize.Field.StringField;
      operator: StringOperator;
      value: string;
    }

    export type NumberMatch = { 
      _type: "NumberMatch";
      field: Transaction.Materialize.Field.NumberField;
      operator: NumberOperator;
      value: number;
    }

    export type Exists = { 
      _type: "Exists";
      field: Transaction.Materialize.Field.OptionNumberField;
    }

    export type StringGlob = { 
      _type: "StringGlob";
      field: Transaction.Materialize.Field.StringField;
      value: string;
    }

    export type t = And | Not | StringMatch | NumberMatch | Exists | StringGlob
  }

  export namespace Attach {
    export type t = {
      _type: "Attach";
      where: Clause.t;
      field: string;
      value: string;
    }
  }

  export namespace Split {
    export type Percent = {
      _type: "Percent";
      account: string;
      percent: number;
    }

    export type Value = {
      _type: "Value";
      account: string;
      value: number;
    }

    export type SplitByPercent = {
      _type: "SplitByPercent";
      where: Clause.t;
      splits: Percent[];
    }

    export type SplitByValue = {
      _type: "SplitByValue";
      where: Clause.t;
      splits: Value[];
      remainder: string;
    }

    export type t = SplitByPercent | SplitByValue
  }

  export namespace Include {
    export type t = {
      _type: "Include";
      where: Clause.t;
    }
  }

  export type Rule = Attach.t | Split.t | Include.t

  export const collectAttach = (rule: Rule): O.Option<Attach.t> => {
    switch (rule._type) {
      case "Attach":
        return O.some(rule);
      case "SplitByPercent":
        return O.none;
      case "SplitByValue":
        return O.none;
      case "Include":
        return O.none;
    }
  }

  export const collectSplit = (rule: Rule): O.Option<Split.t> => {
    switch (rule._type) {
      case "Attach":
        return O.none;
      case "SplitByPercent":
        return O.some(rule);
      case "SplitByValue":
        return O.some(rule);
      case "Include":
        return O.none;
    }
  }

  export const collectInclude = (rule: Rule): O.Option<Include.t> => {
    switch (rule._type) {
      case "Attach":
        return O.none;
      case "SplitByPercent":
        return O.none;
      case "SplitByValue":
        return O.none;
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

    export const Exists: iot.Type<Internal.Clause.Exists> = iot.type({
        _type: iot.literal("Exists")
      , field: Transaction.Json.Field.OptionNumberField
    });

    export const StringGlob: iot.Type<Internal.Clause.StringGlob> = iot.type({
        _type: iot.literal("StringGlob")
      , field: Transaction.Json.Field.StringField
      , value: iot.string
    });

    export const t = iot.recursion<Internal.Clause.t>("t", () => iot.union([And, Not, StringMatch, NumberMatch, Exists, StringGlob]));
  }

  export namespace Attach {
    export const t = iot.type({
        _type: iot.literal("Attach")
      , where: Clause.t
      , field: iot.string
      , value: iot.string
    });
  }

  export namespace Split {
    export const Percent = iot.type({
        _type: iot.literal("Percent")
      , account: iot.string
      , percent: iot.number
    });

    export const Value = iot.type({
        _type: iot.literal("Value")
      , account: iot.string
      , value: iot.number
    });

    export const SplitByPercent = iot.type({
        _type: iot.literal("SplitByPercent")
      , where: Clause.t
      , splits: iot.array(Percent)
    });

    export const SplitByValue = iot.type({
        _type: iot.literal("SplitByValue")
      , where: Clause.t
      , splits: iot.array(Value)
      , remainder: iot.string
    });

    export const t = iot.union([SplitByPercent, SplitByValue])
  }

  export namespace Include {
    export const t = iot.type({
        _type: iot.literal("Include")
      , where: Clause.t
    });
  }

  export const Rule = iot.union([Attach.t, Split.t, Include.t])

  export const Request = iot.type({
      accountId: iot.string
    , rule: Rule
  });

  export const from = (rule: any): E.Either<Exception.t, Internal.t> => {
    return pipe(
        rule
      , Request.decode
      , E.map(rule => { return { ...rule, id: O.none }; })
      , E.mapLeft((_) => Exception.throwMalformedJson)
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
