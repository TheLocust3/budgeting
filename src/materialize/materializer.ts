import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

import * as Transaction from '../model/transaction';
import * as Rule from '../model/rule';
import * as Plan from './plan';

type Materializer = (transaction: Transaction.Internal.t) => O.Option<Transaction.Internal.t>;
type Predicate = (transaction: Transaction.Internal.t) => Boolean;

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

const buildPredicate = (pred: Predicate): Materializer => {
  return (transaction: Transaction.Internal.t) => {
    if (pred(transaction)) {
      return O.some(transaction)
    } else {
      return O.none
    }
  };
}

const buildSelect = (rule: Rule.Internal.Select): Materializer => {
  // INVARIANT: we've validated the schema and all the fields + types line up
  switch (rule.operator) {
    case "Eq":
      return buildPredicate((transaction) => getField(rule.field)(transaction) === rule.value);
    case "Neq":
      return buildPredicate((transaction) => getField(rule.field)(transaction) !== rule.value);
    case "Gt":
      return buildPredicate((transaction) => Number(getField(rule.field)(transaction)) > Number(rule.value));
    case "Lt":
      return buildPredicate((transaction) => Number(getField(rule.field)(transaction)) < Number(rule.value));
    case "Gte":
      return buildPredicate((transaction) => Number(getField(rule.field)(transaction)) >= Number(rule.value));
    case "Lte":
      return buildPredicate((transaction) => Number(getField(rule.field)(transaction)) <= Number(rule.value));
  }
}

// TODO: JK
const buildAttach = (rule: Rule.Internal.Attach): Materializer => {
  return (transaction: Transaction.Internal.t) => O.some(transaction)
}

const buildStage = (stage: Plan.Stage): Materializer => {
  const selectMaterializers = A.map(buildSelect)(stage.select);
  const attachMaterializers = A.map(buildAttach)(stage.attach);

  return (transaction: Transaction.Internal.t) => pipe(
      selectMaterializers.concat(attachMaterializers)
    , A.reduce(O.some(transaction), (transaction, materializer) => pipe(transaction, O.map(materializer), O.flatten))
  );
}

export const build = (plan: Plan.t): Materializer => {
  return (transaction: Transaction.Internal.t) => pipe(
      plan.stages
    , A.map(buildStage)
    , A.reduce(O.some(transaction), (transaction, materializer) => pipe(transaction, O.map(materializer), O.flatten))
  );
}
