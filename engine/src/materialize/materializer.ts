import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as E from "fp-ts/Either";
import * as O from "fp-ts/Option";

import { Transaction } from "model";
import { Rule } from "model";
import * as Plan from "./plan";

export type Conflict = {
  _type: "Conflict";
  element: Transaction.Internal.t;
  rules: Rule.Internal.Rule[];
};

export type Tagged = {
  _type: "Tagged";
  tag: string;
  element: Transaction.Internal.t;
};

export type Untagged = {
  _type: "Untagged";
  element: Transaction.Internal.t;
};

export type TaggedSet = {
  _type: "TaggedSet";
  elements: Tagged[];
};

export type Element = Conflict | TaggedSet | Untagged;

export type Flow = (transaction: Transaction.Internal.t) => Element;

type TagFlow = (transaction: Transaction.Internal.t) => O.Option<TaggedSet>;
type PassthroughFlow = (transaction: Transaction.Internal.t) => Transaction.Internal.t;
type FilterFlow = (transaction: Transaction.Internal.t) => O.Option<Transaction.Internal.t>;

type Predicate = (transaction: Transaction.Internal.t) => boolean
type EvaluateTo<T> = (transaction: Transaction.Internal.t) => T

const buildStringPredicate = (field: Transaction.Internal.Field.StringField) => (pred: (value: string) => boolean): Predicate => {
  return (transaction) => pred(transaction[field]);
};

const buildNumberPredicate = (field: Transaction.Internal.Field.NumberField) => (pred: (value: number) => boolean): Predicate => {
  if (field === "capturedAt") {
    return (transaction) => O.match(
        () => false
      , (capturedAt: Date) => pred(capturedAt.getTime())
    )(transaction.capturedAt);
  } else if (field === "authorizedAt") {
    return (transaction) => pred(transaction[field].getTime());
  } else {
    return (transaction) => pred(transaction[field]);
  }
};

const buildStringMatch = (rule: Rule.Internal.Clause.StringMatch): Predicate => {
  switch (rule.operator) {
    case "Eq":
      return buildStringPredicate(rule.field)((value) => value === rule.value);
    case "Neq":
      return buildStringPredicate(rule.field)((value) => value !== rule.value);
  }
};

const buildNumberMatch = (rule: Rule.Internal.Clause.NumberMatch): Predicate => {
  switch (rule.operator) {
    case "Eq":
      return buildNumberPredicate(rule.field)((value) => value === rule.value);
    case "Neq":
      return buildNumberPredicate(rule.field)((value) => value !== rule.value);
    case "Gt":
      return buildNumberPredicate(rule.field)((value) => value > rule.value);
    case "Lt":
      return buildNumberPredicate(rule.field)((value) => value < rule.value);
    case "Gte":
      return buildNumberPredicate(rule.field)((value) => value >= rule.value);
    case "Lte":
      return buildNumberPredicate(rule.field)((value) => value <= rule.value);
  }
};

const buildExists = (rule: Rule.Internal.Clause.Exists): Predicate => {
  return (transaction: Transaction.Internal.t) => O.match(() => false, (_) => true)(transaction[rule.field]);
};

const buildStringGlob = (rule: Rule.Internal.Clause.StringGlob): Predicate => {
  const matcher = new RegExp(rule.value.replaceAll("*", "(.*)")); // TODO: JK might need to escape some stuff
  return (transaction: Transaction.Internal.t) => matcher.test(transaction[rule.field]);
};

const buildClause = (clause: Rule.Internal.Clause.t): Predicate => {
  switch (clause._type) {
    case "And":
      const left = buildClause(clause.left);
      const right = buildClause(clause.right);
      return (transaction: Transaction.Internal.t) => left(transaction) && right(transaction);
    case "Not":
      const inner = buildClause(clause.clause);
      return (transaction: Transaction.Internal.t) => !inner(transaction);
    case "StringMatch":
      const stringMatch = buildStringMatch(clause);
      return (transaction: Transaction.Internal.t) => stringMatch(transaction);
    case "NumberMatch":
      const numberMatch = buildNumberMatch(clause);
      return (transaction: Transaction.Internal.t) => numberMatch(transaction);
    case "Exists":
      const exists = buildExists(clause);
      return (transaction: Transaction.Internal.t) => exists(transaction);
    case "StringGlob":
      const stringGlob = buildStringGlob(clause);
      return (transaction: Transaction.Internal.t) => stringGlob(transaction);
  }
};

const buildAttach = (rule: Rule.Internal.Attach.t): PassthroughFlow => {
  const where = buildClause(rule.where);
  return (transaction: Transaction.Internal.t) => {
    if (where(transaction)) {
      try {
        return { 
            ...transaction
          , custom: { ...transaction.custom, [rule.field]: transaction.custom[rule.field].concat(rule.value) }
        };
      } catch (_) { // if [rule.field] key doesn't exist
        return { 
            ...transaction
          , custom: { ...transaction.custom, [rule.field]: [rule.value] }
        };
      }
    } else {
      return transaction;
    }
  };
};

const buildSplitByPercent = (rule: Rule.Internal.Split.SplitByPercent): TagFlow => {
  const where = buildClause(rule.where);
  return (transaction: Transaction.Internal.t) => {
    if (where(transaction)) {
      const tagged = A.map((split: Rule.Internal.Split.Percent) => {
        const splitTransaction = { ...transaction, amount: transaction.amount * split.percent };

        return { _type: "Tagged", tag: split.account, element: splitTransaction };
      })(rule.splits);

      return <O.Option<TaggedSet>>O.some({ _type: "TaggedSet", elements: tagged });
    } else {
      return <O.Option<TaggedSet>>O.none;
    }
  };
};

const buildSplitByValue = (rule: Rule.Internal.Split.SplitByValue): TagFlow => {
  const where = buildClause(rule.where);
  return (transaction: Transaction.Internal.t) => {
    if (where(transaction)) {
      const [remaining, tagged]: [number, Tagged[]] = A.reduce(
          <[number, Tagged[]]>[transaction.amount, []]
        , ([remaining, tagged]: [number, Tagged[]], split: Rule.Internal.Split.Value) => {
            if (remaining > 0) {
              if (remaining >= split.value) {
                const splitTransaction = { ...transaction, amount: split.value };

                return <[number, Tagged[]]>[remaining - split.value, tagged.concat({ _type: "Tagged", tag: split.account, element: splitTransaction })];
              } else {
                const splitTransaction = { ...transaction, amount: remaining };

                return <[number, Tagged[]]>[0, tagged.concat({ _type: "Tagged", tag: split.account, element: splitTransaction })];
              }
            } else {
              return <[number, Tagged[]]>[0, tagged];
            }
          }
      )(rule.splits);

      if (remaining > 0) {
        const splitTransaction = { ...transaction, amount: remaining };
        return <O.Option<TaggedSet>>O.some({ 
            _type: "TaggedSet"
          , elements: tagged.concat({ _type: "Tagged", tag: rule.remainder, element: splitTransaction })
        });
      } else {
        return <O.Option<TaggedSet>>O.some({ _type: "TaggedSet", elements: tagged });
      }
    } else {
      return <O.Option<TaggedSet>>O.none;
    }
  };
};

const buildSplit = (rule: Rule.Internal.Split.t): TagFlow => {
  switch (rule._type) {
    case "SplitByPercent":
      return buildSplitByPercent(rule);
    case "SplitByValue":
    return buildSplitByValue(rule);
  }
};

const buildInclude = (rule: Rule.Internal.Include.t): Predicate => {
  return buildClause(rule.where);
};

const buildAttachFlow = (attach: Rule.Internal.Attach.t[]): PassthroughFlow => {
  const attachFlows = A.map(buildAttach)(attach);

  return (transaction: Transaction.Internal.t) => pipe(
      attachFlows
    , A.reduce(transaction, (out: Transaction.Internal.t, flow) => flow(out))
  );
};

const buildSplitFlow = (split: Rule.Internal.Split.t[]): Flow => {
  const splitFlows: [Rule.Internal.Split.t, TagFlow][] = A.map((split: Rule.Internal.Split.t) => {
    return <[Rule.Internal.Split.t, TagFlow]>[split, buildSplit(split)];
  })(split);

  return (transaction: Transaction.Internal.t) => {
    const [_, out]: [O.Option<Rule.Internal.Split.t>, Element] = pipe(
        splitFlows
      , A.map(([split, flow]) => <[Rule.Internal.Split.t, O.Option<TaggedSet>]>[split, flow(transaction)])
      , A.reduce(
            <[O.Option<Rule.Internal.Split.t>, Element]>[O.none, { _type: "Untagged", element: transaction }]
          , ([last, out]: [O.Option<Rule.Internal.Split.t>, Element], [split, maybeTagged]: [Rule.Internal.Split.t, O.Option<TaggedSet>]) => O.match(
                () => <[O.Option<Rule.Internal.Split.t>, Element]>[last, out]
              , (tagged: TaggedSet) => {
                  switch (out._type) {
                    case "Conflict":
                      return <[O.Option<Rule.Internal.Split.t>, Element]>[O.some(split), { ...out, rules: out.rules.concat(split) }];
                    case "TaggedSet":
                      const rules = O.match(() => [], (last) => [last])(last).concat(split);
                      return <[O.Option<Rule.Internal.Split.t>, Element]>[O.some(split), { _type: "Conflict", element: transaction, rules: rules }];
                    case "Untagged":
                      return <[O.Option<Rule.Internal.Split.t>, Element]>[O.some(split), tagged];
                  }
                }
            )(maybeTagged)
        )
    );

    return out;
  };
};

const buildIncludeFlow = (include: Rule.Internal.Include.t[]): FilterFlow => {
  const includeFlows = A.map(buildInclude)(include);
  return (transaction: Transaction.Internal.t) => {
    return pipe(
        includeFlows
      , A.map((flow) => flow(transaction))
      , A.reduce(<O.Option<Transaction.Internal.t>>O.none, (out, keep) => {
          if (keep) {
            return O.some(transaction);
          } else {
            return out;
          }
        })
    );
  };
};

const buildSplitStage = (stage: Plan.SplitStage): Flow => {
  const attachFlow = buildAttachFlow(stage.attach);
  const splitFlow = buildSplitFlow(stage.split);

  return (transaction: Transaction.Internal.t) => {
    return pipe(
        transaction
      , attachFlow
      , splitFlow
    );
  };
};

const buildIncludeStage = (stage: Plan.IncludeStage): Flow => {
  const attachFlow = buildAttachFlow(stage.attach);
  const includeFlow = buildIncludeFlow(stage.include);

  return (transaction: Transaction.Internal.t) => {
    return pipe(
        transaction
      , attachFlow
      , includeFlow
      , O.match(
            () => {
              return <Element>{ _type: "TaggedSet", elements: [] };
            }
          , (element) => {
              return <Element>{
                  _type: "TaggedSet"
                , elements: A.map((child: string) => {
                    return { _type: "Tagged", tag: child, element: element };
                  })(stage.children)
              };
            }
        )
    );
  };
};

export const build = (stage: Plan.Stage): Flow => {
  switch (stage._type) {
    case "SplitStage":
      return buildSplitStage(stage);
    case "IncludeStage":
      return buildIncludeStage(stage);
  }
};
