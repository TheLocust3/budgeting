import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as iot from "io-ts";

import * as Transaction from "./transaction";
import { Exception, Format } from "../magic";

export namespace Internal {
  export namespace Clause {
    export type StringOperator = "Eq" | "Neq"
    export const StringOperator = iot.union([
        iot.literal("Eq")
      , iot.literal("Neq")
    ]);

    export type NumberOperator = "Eq" | "Neq" | "Gt" | "Lt" | "Gte" | "Lte"
    export const NumberOperator = iot.union([
        iot.literal("Eq")
      , iot.literal("Neq")
      , iot.literal("Gt")
      , iot.literal("Lt")
      , iot.literal("Gte")
      , iot.literal("Lte")
    ]);

    export type Operator = StringOperator | NumberOperator
    export const Operator = iot.union([
        StringOperator
      , NumberOperator
    ]);

    export type And = { 
      _type: "And";
      left: t;
      right: t;
    }
    export const And: iot.Type<And> = iot.recursion("t", () => iot.type({
        _type: iot.literal("And")
      , left: t
      , right: t
    }));

    export type Not = {
      _type: "Not";
      clause: t;
    }
    export const Not: iot.Type<Not> = iot.recursion("t", () => iot.type({
        _type: iot.literal("Not")
      , clause: t
    }));

    export type StringMatch = { 
      _type: "StringMatch";
      field: Transaction.Internal.Field.StringField;
      operator: StringOperator;
      value: string;
    }
    export const StringMatch: iot.Type<StringMatch> = iot.type({
        _type: iot.literal("StringMatch")
      , field: Transaction.Internal.Field.StringField
      , operator: StringOperator
      , value: iot.string
    });

    export type NumberMatch = { 
      _type: "NumberMatch";
      field: Transaction.Internal.Field.NumberField;
      operator: NumberOperator;
      value: number;
    }
    export const NumberMatch: iot.Type<NumberMatch> = iot.type({
        _type: iot.literal("NumberMatch")
      , field: Transaction.Internal.Field.NumberField
      , operator: NumberOperator
      , value: iot.number
    });

    export type Exists = { 
      _type: "Exists";
      field: Transaction.Internal.Field.OptionNumberField;
    }
    export const Exists: iot.Type<Exists> = iot.type({
        _type: iot.literal("Exists")
      , field: Transaction.Internal.Field.OptionNumberField
    });

    export type StringGlob = { 
      _type: "StringGlob";
      field: Transaction.Internal.Field.StringField;
      value: string;
    }
    export const StringGlob: iot.Type<StringGlob> = iot.type({
        _type: iot.literal("StringGlob")
      , field: Transaction.Internal.Field.StringField
      , value: iot.string
    });

    export type t = And | Not | StringMatch | NumberMatch | Exists | StringGlob
    export const t = iot.recursion<t>("t", () => iot.union([And, Not, StringMatch, NumberMatch, Exists, StringGlob]));
  }

  export namespace Attach {
    export type t = {
      _type: "Attach";
      where: Clause.t;
      field: string;
      value: string;
    }
    export const t = iot.type({
        _type: iot.literal("Attach")
      , where: Clause.t
      , field: iot.string
      , value: iot.string
    });
  }

  export namespace Split {
    export type Percent = {
      _type: "Percent";
      account: string;
      percent: number;
    }
    export const Percent = iot.type({
        _type: iot.literal("Percent")
      , account: iot.string
      , percent: iot.number
    });

    export type Value = {
      _type: "Value";
      account: string;
      value: number;
    }
    export const Value = iot.type({
        _type: iot.literal("Value")
      , account: iot.string
      , value: iot.number
    });

    export type SplitByPercent = {
      _type: "SplitByPercent";
      where: Clause.t;
      splits: Percent[];
    }
    export const SplitByPercent = iot.type({
        _type: iot.literal("SplitByPercent")
      , where: Clause.t
      , splits: iot.array(Percent)
    });

    export type SplitByValue = {
      _type: "SplitByValue";
      where: Clause.t;
      splits: Value[];
      remainder: string;
    }
    export const SplitByValue = iot.type({
        _type: iot.literal("SplitByValue")
      , where: Clause.t
      , splits: iot.array(Value)
      , remainder: iot.string
    });

    export type t = SplitByPercent | SplitByValue
    export const t = iot.union([SplitByPercent, SplitByValue]);

    export const collectAccounts = (rule: Split.t): string[] => {
      switch (rule._type) {
        case "SplitByPercent":
          return pipe(rule.splits, A.map((split: Percent) => split.account));
        case "SplitByValue":
          return pipe(rule.splits, A.map((split: Value) => split.account), A.append(rule.remainder));
      }
    };
  }

  export namespace Include {
    export type t = {
      _type: "Include";
      where: Clause.t;
    }
    export const t = iot.type({
        _type: iot.literal("Include")
      , where: Clause.t
    });
  }

  export type Rule = Attach.t | Split.t | Include.t
  export const Rule = iot.union([Attach.t, Split.t, Include.t]);

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
  };

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
  };

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
  };


  export const t = iot.type({
      id: iot.string
    , accountId: iot.string
    , userId: iot.string
    , rule: Rule
  });

  export type t = iot.TypeOf<typeof t>
  export const Json = new Format.JsonFormatter(t);
  export const Database = new class implements Format.Formatter<t> {
    TableType = iot.type({
        id: iot.string
      , account_id: iot.string
      , user_id: iot.string
      , rule: Internal.Rule
    });    

    public from = (obj: any): E.Either<Exception.t, t> => {
      return pipe(
          obj
        , this.TableType.decode
        , E.mapLeft(Exception.throwInternalError)
        , E.map(({ id, account_id, user_id, rule }) => { return { id: id, accountId: account_id, userId: user_id, rule: rule } })
      );
    }

    public to = (obj: t): any => {
      return {
          id: obj.id
        , account_id: obj.accountId
        , user_id: obj.userId
        , rule: obj.rule
      }
    }
  };
}

export namespace Frontend {
  export namespace Create {
    const t = iot.type({
        id: iot.string
      , accountId: iot.string
      , userId: iot.string
      , rule: Internal.Rule
    });

    export type t = iot.TypeOf<typeof t>;
    export const Json = new Format.JsonFormatter(t);
  }
}

export namespace Channel {
  export namespace Query {
    const t = iot.type({
        accountId: iot.string
      , userId: iot.string
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
  }

  export namespace Response {
    export namespace RuleList {
      const t = iot.type({
          rules: iot.array(Internal.t)
      });

      export type t = iot.TypeOf<typeof t>
      export const Json = new Format.JsonFormatter(t);
    }
  }
}
