import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

import * as Transaction from '../model/transaction';
import * as Rule from '../model/rule';
import * as Plan from './plan';

type Materializer = (transaction: Transaction.Internal.t) => O.Option<Transaction.Internal.t>;
type Predicate = (transaction: Transaction.Internal.t) => Boolean

const getField = (field: string) => (transaction: Transaction.Internal.t): string => {
  if (field == "id") {
    return O.getOrElse(() => "")(transaction.id) // TODO: JK not the best solution
  } else if (field.startsWith("metadata.")) {
    const newField = field.replace("metadata.", "")
    return String((transaction.metadata as any)[newField]) // JK: yeehaw
  } else {
    return String((transaction as any)[field]) // JK: yeehaw
  }
}

const buildMatch = (rule: Rule.Internal.Clause.Match): Predicate => {
  switch (rule.operator) {
    case "Eq":
      return (transaction) => getField(rule.field)(transaction) === rule.value;
    case "Neq":
      return (transaction) => getField(rule.field)(transaction) !== rule.value;
    case "Gt":
      return (transaction) => Number(getField(rule.field)(transaction)) > Number(rule.value);
    case "Lt":
      return (transaction) => Number(getField(rule.field)(transaction)) < Number(rule.value);
    case "Gte":
      return (transaction) => Number(getField(rule.field)(transaction)) >= Number(rule.value);
    case "Lte":
      return (transaction) => Number(getField(rule.field)(transaction)) <= Number(rule.value);
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
    case "Match":
      const match = buildMatch(clause)
      return (transaction: Transaction.Internal.t) => match(transaction);
  }
}

const buildInclude = (rule: Rule.Internal.Include): Predicate => {
  return buildClause(rule.clause);
}

const buildStage = (stage: Plan.Stage): Materializer => {
  const includeMaterializers = A.map(buildInclude)(stage.include);
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
  );
}

export const build = (plan: Plan.t): Materializer => {
  return (transaction: Transaction.Internal.t) => pipe(
      plan.stages
    , A.map(buildStage)
    , A.reduce(O.some(transaction), (transaction, materializer) => pipe(transaction, O.map(materializer), O.flatten))
  );
}
