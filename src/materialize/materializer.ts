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
  rules: Rule.Internal.t[];
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

export type Element = Conflict | Tagged | Untagged;

export type Flow = (transaction: Transaction.Materialize.t) => Element;

type TagFlow = (transaction: Transaction.Materialize.t) => O.Option<Tagged>;
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
      return { ...transaction, custom: { ...transaction.custom, [rule.field]: rule.value } };
    } else {
      return transaction;
    }
  };
}

const buildSplitByPercent = (rule: Rule.Internal.Split.SplitByPercent): TagFlow => {
  const where = buildClause(rule.where);
  return (transaction: Transaction.Materialize.t) => {
    if (where(transaction)) {
      return O.none; // TODO: JK
    } else {
      return O.none;
    }
  };
}

const buildSplitByValue = (rule: Rule.Internal.Split.SplitByValue): TagFlow => {
  const where = buildClause(rule.where);
  return (transaction: Transaction.Materialize.t) => {
    if (where(transaction)) {
      return O.none; // TODO: JK
    } else {
      return O.none;
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

  // TODO: JK conflict resolution
  return (transaction: Transaction.Materialize.t) => pipe(
      attachFlows
    , A.reduce(transaction, (out: Transaction.Materialize.t, flow) => flow(out))
  );
}

const buildSplitStage = (split: Rule.Internal.Split.t[]): Flow => {
  const splitFlows = A.map(buildSplit)(split);

  return (transaction: Transaction.Materialize.t) => pipe(
      splitFlows
    , A.map((flow) => flow(transaction))
    , A.reduce(<Element>{ _type: "Untagged", element: transaction }, (out: Element, maybeTagged: O.Option<Tagged>) => O.match(
          () => out
        , (tagged) => {
            switch (out._type) {
              case "Conflict":
                return out;
              case "Tagged": // TODO: JK conflict resolution
                return out;
              case "Untagged":
                return <Element>tagged;
            }
          }
      )(maybeTagged))
  );
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
