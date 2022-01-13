import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

import * as Transaction from '../model/transaction';
import * as Rule from '../model/rule';
import * as Plan from './plan';

type Materializer = (transaction: Transaction.Internal.t) => O.Option<Transaction.Internal.t>;
type Update = (transaction: Transaction.Internal.t) => Transaction.Internal.t;

type Predicate = (transaction: Transaction.Internal.t) => Boolean
type EvaluateTo<T> = (transaction: Transaction.Internal.t) => T

const buildStringPredicate = (field: Transaction.Internal.Field.StringField) => (pred: (value: string) => Boolean): Predicate => {
  if (field == "id") {
    return (transaction) => O.match(
        () => false
      , (id: string) => pred(id)
    )(transaction.id);
  } else {
    return (transaction) => pred(String(transaction[field])); // TODO: JK need further refinement to get rid of this toString (string | Date | Option<Date>)
  }
}

const buildNumberPredicate = (field: Transaction.Internal.Field.NumberField) => (pred: (value: number) => Boolean): Predicate => {
  return (transaction) => pred(transaction[field]);
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
      const stringMatch = buildStringMatch(clause)
      return (transaction: Transaction.Internal.t) => stringMatch(transaction);
    case "NumberMatch":
      const numberMatch = buildNumberMatch(clause)
      return (transaction: Transaction.Internal.t) => numberMatch(transaction);
  }
}

const buildExpression = (rule: Rule.Internal.Expression.t): EvaluateTo<string> => {
  return (transaction: Transaction.Internal.t) => ""; // TODO: JK
}

const buildInclude = (rule: Rule.Internal.Include): Predicate => {
  return buildClause(rule.clause);
}

const buildUpdate = (rule: Rule.Internal.Update): Update => {
  const where = buildClause(rule.where);
  const expression = buildExpression(rule.expression);
  return (transaction: Transaction.Internal.t) => transaction;
}

const buildStage = (stage: Plan.Stage): Materializer => {
  const includeMaterializers = A.map(buildInclude)(stage.include);
  const updateMaterializers = A.map(buildUpdate)(stage.update);

  // TODO: JK this could all be a bit more clear
  return (transaction: Transaction.Internal.t) => pipe(
      includeMaterializers
    , A.reduce(O.none, (out: O.Option<Transaction.Internal.t>, materializer) => O.match( // JK: construct an "or" of includes (a DNF)
          () => {
            if (materializer(transaction)) {
              return O.some(transaction);
            } else {
              return O.none;
            }
          }
        , (_) => O.some(transaction)
      )(out))
    , O.map((transaction) => 
        A.reduce(transaction, (transaction: Transaction.Internal.t, materializer: Update) =>
          materializer(transaction)
        )(updateMaterializers)
      )
  );
}

export const build = (plan: Plan.t): Materializer => {
  return (transaction: Transaction.Internal.t) => pipe(
      plan.stages
    , A.map(buildStage)
    , A.reduce(O.some(transaction), (transaction, materializer) => pipe(transaction, O.map(materializer), O.flatten))
  );
}
