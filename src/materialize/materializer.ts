import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

import * as Transaction from '../model/transaction';
import * as Rule from '../model/rule';
import * as Plan from './plan';

export type Conflict = {
  _type: "Conflict";
  element: Transaction.Materialize.t;
  rules: Rule.Internal.Rule[];
};

export type Tagged = {
  _type: "Tagged";
  tag: string;
  element: Transaction.Materialize.t;
};

export type Untagged = {
  _type: "Untagged";
  element: Transaction.Materialize.t;
};

export type TaggedSet = {
  _type: "TaggedSet";
  elements: Tagged[];
};

export type Element = Conflict | TaggedSet | Untagged;

export type Flow = (transaction: Transaction.Materialize.t) => Element;

type TagFlow = (transaction: Transaction.Materialize.t) => O.Option<TaggedSet>;
type PassthroughFlow = (transaction: Transaction.Materialize.t) => Transaction.Materialize.t;

type Predicate = (transaction: Transaction.Materialize.t) => Boolean
type EvaluateTo<T> = (transaction: Transaction.Materialize.t) => T

const buildStringPredicate = (field: Transaction.Materialize.Field.StringField) => (pred: (value: string) => Boolean): Predicate => {
  return (transaction) => pred(transaction[field]);
}

const buildNumberPredicate = (field: Transaction.Materialize.Field.NumberField) => (pred: (value: number) => Boolean): Predicate => {
  if (field == "capturedAt") {
    return (transaction) => O.match(
        () => false
      , (capturedAt: number) => pred(capturedAt)
    )(transaction.capturedAt);
  } else {
    return (transaction) => pred(transaction[field]);
  }
}

const buildStringMatch = (rule: Rule.Internal.Clause.StringMatch): Predicate => {
  switch (rule.operator) {
    case "Eq":
      return buildStringPredicate(rule.field)((value) => value === rule.value);
    case "Neq":
      return buildStringPredicate(rule.field)((value) => value !== rule.value);
  }
}

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
}

const buildExists = (rule: Rule.Internal.Clause.Exists): Predicate => {
  return (transaction: Transaction.Materialize.t) => O.match(() => false, (_) => true)(transaction[rule.field]);
}

const buildStringGlob = (rule: Rule.Internal.Clause.StringGlob): Predicate => {
  const matcher = new RegExp(rule.value.replaceAll("*", "(.*)")); // TODO: JK might need to escape some stuff
  return (transaction: Transaction.Materialize.t) => matcher.test(transaction[rule.field]);
}

const buildClause = (clause: Rule.Internal.Clause.t): Predicate => {
  switch (clause._type) {
    case "And":
      const left = buildClause(clause.left);
      const right = buildClause(clause.right);
      return (transaction: Transaction.Materialize.t) => left(transaction) && right(transaction);
    case "Not":
      const inner = buildClause(clause.clause);
      return (transaction: Transaction.Materialize.t) => !inner(transaction);
    case "StringMatch":
      const stringMatch = buildStringMatch(clause)
      return (transaction: Transaction.Materialize.t) => stringMatch(transaction);
    case "NumberMatch":
      const numberMatch = buildNumberMatch(clause)
      return (transaction: Transaction.Materialize.t) => numberMatch(transaction);
    case "Exists":
      const exists = buildExists(clause)
      return (transaction: Transaction.Materialize.t) => exists(transaction);
    case "StringGlob":
      const stringGlob = buildStringGlob(clause)
      return (transaction: Transaction.Materialize.t) => stringGlob(transaction);
  }
}

const buildAttach = (rule: Rule.Internal.Attach.t): PassthroughFlow => {
  const where = buildClause(rule.where);
  return (transaction: Transaction.Materialize.t) => {
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
}

const buildSplitByPercent = (rule: Rule.Internal.Split.SplitByPercent): TagFlow => {
  const where = buildClause(rule.where);
  return (transaction: Transaction.Materialize.t) => {
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
}

const buildSplitByValue = (rule: Rule.Internal.Split.SplitByValue): TagFlow => {
  const where = buildClause(rule.where);
  return (transaction: Transaction.Materialize.t) => {
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
      )(rule.splits)

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
}

const buildSplit = (rule: Rule.Internal.Split.t): TagFlow => {
  switch (rule._type) {
    case "SplitByPercent":
      return buildSplitByPercent(rule);
    case "SplitByValue":
    return buildSplitByValue(rule);
  }
}

const buildAttachStage = (attach: Rule.Internal.Attach.t[]): PassthroughFlow => {
  const attachFlows = A.map(buildAttach)(attach);

  return (transaction: Transaction.Materialize.t) => pipe(
      attachFlows
    , A.reduce(transaction, (out: Transaction.Materialize.t, flow) => flow(out))
  );
}

const buildSplitStage = (split: Rule.Internal.Split.t[]): Flow => {
  const splitFlows: [Rule.Internal.Split.t, TagFlow][] = A.map((split: Rule.Internal.Split.t) => {
    return <[Rule.Internal.Split.t, TagFlow]>[split, buildSplit(split)]
  })(split);

  return (transaction: Transaction.Materialize.t) => {
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
                      return <[O.Option<Rule.Internal.Split.t>, Element]>[O.some(split), { _type: "Conflict", element: transaction, rules: rules }]
                    case "Untagged":
                      return <[O.Option<Rule.Internal.Split.t>, Element]>[O.some(split), tagged];
                  }
                }
            )(maybeTagged)
        )
    );

    return out;
  }
}

export const build = (stage: Plan.Stage): Flow => {
  const attachFlow = buildAttachStage(stage.attach);
  const splitFlow = buildSplitStage(stage.split)

  return (transaction: Transaction.Materialize.t) => {
    return pipe(
        transaction
      , attachFlow
      , splitFlow
    );
  }
}
