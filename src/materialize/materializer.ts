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

const withString = (
    transaction: Transaction.Internal.t
  , field: Transaction.Internal.Field.UpdateStringField
  , value: string
): Transaction.Internal.t => {
  switch (field) {
    case "id":
    case "sourceId":
    case "merchantName":
    case "description":
    case "authorizedAt":
    case "capturedAt":
      return { ...transaction, [field]: value };
    default:
      switch (field._type) {
        case "CustomStringField":
          return { ...transaction, custom: { ...transaction.custom, [field.field]: value } };
      }
  }
}

const withNumber = (
    transaction: Transaction.Internal.t
  , field: Transaction.Internal.Field.UpdateNumberField
  , value: number
): Transaction.Internal.t => {
  switch (field) {
    case "amount":
      return { ...transaction, [field]: value };
    default:
      switch (field._type) {
        case "CustomNumberField":
          return { ...transaction, custom: { ...transaction.custom, [field.field]: value } };
      }
  }
}

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

const buildStringExpression = (expression: Rule.Internal.Expression.StringExpression): EvaluateTo<string> => {
  switch (expression._type) {
    case "Concat":
      const left = buildExpression(expression.left);
      const right = buildExpression(expression.right);
      return (transaction: Transaction.Internal.t) => String(left(transaction)) + String(right(transaction));
    case "StringReference":
      return (transaction: Transaction.Internal.t) => String(transaction[expression.field]); // TODO: JK we'd like to remove the toString here
    case "StringLiteral":
      return (transaction: Transaction.Internal.t) => expression.value;
  }
}

const buildNumberExpression = (expression: Rule.Internal.Expression.NumberExpression): EvaluateTo<number> => {
  switch (expression._type) {
    case "Add":
      const addLeft = buildNumberExpression(expression.left);
      const addRight = buildNumberExpression(expression.right);
      return (transaction: Transaction.Internal.t) => addLeft(transaction) + addRight(transaction);
    case "Sub":
      const subLeft = buildNumberExpression(expression.left);
      const subRight = buildNumberExpression(expression.right);
      return (transaction: Transaction.Internal.t) => subLeft(transaction) - subRight(transaction);
    case "Mul":
      const mulLeft = buildNumberExpression(expression.left);
      const mulRight = buildNumberExpression(expression.right);
      return (transaction: Transaction.Internal.t) => mulLeft(transaction) * mulRight(transaction);
    case "Div":
      const divLeft = buildNumberExpression(expression.left);
      const divRight = buildNumberExpression(expression.right);
      return (transaction: Transaction.Internal.t) => divLeft(transaction) / divRight(transaction);
    case "Exp":
      const expTerm = buildNumberExpression(expression.term);
      const expPower = buildNumberExpression(expression.power);
      return (transaction: Transaction.Internal.t) => Math.pow(expTerm(transaction), expPower(transaction));
    case "NumberReference":
      return (transaction: Transaction.Internal.t) => transaction[expression.field];
    case "NumberLiteral":
      return (transaction: Transaction.Internal.t) => expression.value;
  }
}

const buildExpression = (expression: Rule.Internal.Expression.t): EvaluateTo<string> => {
  switch (expression._type) {
    case "Add":
    case "Sub":
    case "Mul":
    case "Div":
    case "Exp":
    case "NumberReference":
    case "NumberLiteral":
      const numberExpression = buildNumberExpression(expression);
      return (transaction: Transaction.Internal.t) => String(numberExpression(transaction));
    case "Concat":
    case "StringReference":
    case "StringLiteral":
      return buildStringExpression(expression);
  }
}

const buildInclude = (rule: Rule.Internal.Include): Predicate => {
  return buildClause(rule.clause);
}

const buildUpdateString = (rule: Rule.Internal.UpdateString): Update => {
  const where = buildClause(rule.where);
  const expression = buildStringExpression(rule.expression);
  return (transaction: Transaction.Internal.t) => {
    return withString(transaction, rule.field, expression(transaction));
  };
}

const buildUpdateNumber = (rule: Rule.Internal.UpdateNumber): Update => {
  const where = buildClause(rule.where);
  const expression = buildNumberExpression(rule.expression);
  return (transaction: Transaction.Internal.t) => {
    return withNumber(transaction, rule.field, expression(transaction));
  };
}

const buildUpdate = (rule: Rule.Internal.Update): Update => {
  switch (rule._type) {
    case "UpdateString":
      return buildUpdateString(rule);
    case "UpdateNumber":
      return buildUpdateNumber(rule);
  }
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
