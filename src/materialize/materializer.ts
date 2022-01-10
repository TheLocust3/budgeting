import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

import * as Transaction from '../model/transaction';
import * as Rule from '../model/rule';
import * as Plan from './plan';

type Materializer = (transaction: Transaction.Internal.t) => O.Option<Transaction.Internal.t>;

type Result = "Include" | "Exclude" | "NoMatch"
type IncludeExclude = (transaction: Transaction.Internal.t) => Result

/*type Predicate = (transaction: Transaction.Internal.t) => Boolean;

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
}*/

const buildInclude = (rule: Rule.Internal.Include): IncludeExclude => {
  // INVARIANT: we've validated the schema and all the fields + types line up
  /*switch (rule.operator) {
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
  }*/
  return (transaction: Transaction.Internal.t) => "NoMatch";
}

// TODO: JK
const buildExclude = (rule: Rule.Internal.Exclude): IncludeExclude => {
  return (transaction: Transaction.Internal.t) => "NoMatch";
}

const buildStage = (stage: Plan.Stage): Materializer => {
  const includeMaterializers = A.map(buildInclude)(stage.include);
  const excludeMaterializers = A.map(buildExclude)(stage.exclude);

  const include = (transaction: Transaction.Internal.t): Result => {
    for (let mat of includeMaterializers) {
      if (mat(transaction) === "Include") {
        return "Include"
      }
    }
    return "NoMatch"
  }

  const exclude = (transaction: Transaction.Internal.t): Result => {
    for (let mat of includeMaterializers) {
      if (mat(transaction) === "Exclude") {
        return "Exclude"
      }
    }
    return "NoMatch"
  }

  return (transaction: Transaction.Internal.t) => {
    const includeResult = include(transaction);
    const excludeResult = include(transaction);
    // TODO: JK conflict

    if (includeResult === "Include") {
      return O.some(transaction);
    } else {
      return O.none;
    }
  }
}

export const build = (plan: Plan.t): Materializer => {
  return (transaction: Transaction.Internal.t) => pipe(
      plan.stages
    , A.map(buildStage)
    , A.reduce(O.some(transaction), (transaction, materializer) => pipe(transaction, O.map(materializer), O.flatten))
  );
}
