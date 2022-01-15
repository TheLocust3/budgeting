import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';

import * as Transaction from '../model/transaction';
import * as Rule from '../model/rule';
import * as Plan from './plan';

type Materializer = (transaction: Transaction.Materialize.t) => O.Option<Transaction.Materialize.t>;

type Predicate = (transaction: Transaction.Materialize.t) => Boolean
type EvaluateTo<T> = (transaction: Transaction.Materialize.t) => T

const withString = (
    transaction: Transaction.Materialize.t
  , field: Transaction.Materialize.Field.UpdateStringField
  , value: string
): Transaction.Materialize.t => {
  switch (field) {
    case "id":
    case "sourceId":
    case "merchantName":
    case "description":
      return { ...transaction, [field]: value };
    default:
      switch (field._type) {
        case "CustomStringField":
          return { ...transaction, custom: { ...transaction.custom, [field.field]: value } };
      }
  }
}

const withNumber = (
    transaction: Transaction.Materialize.t
  , field: Transaction.Materialize.Field.UpdateNumberField
  , value: number
): Transaction.Materialize.t => {
  switch (field) {
    case "amount":
    case "authorizedAt":
      return { ...transaction, [field]: value };
    case "capturedAt":
      return { ...transaction, [field]: O.some(value) };
    default:
      switch (field._type) {
        case "CustomNumberField":
          return { ...transaction, custom: { ...transaction.custom, [field.field]: value } };
      }
  }
}

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

const buildStringExpression = (expression: Rule.Internal.Expression.StringExpression): EvaluateTo<O.Option<string>> => {
  switch (expression._type) {
    case "Concat":
      const left = buildExpression(expression.left);
      const right = buildExpression(expression.right);
      return (transaction: Transaction.Materialize.t) => {
        return pipe(
            O.Do
          , O.bind('left', () => left(transaction))
          , O.bind('right', () => right(transaction))
          , O.map(({ left, right }) => left + right)
        );
      };
    case "StringReference":
      return (transaction: Transaction.Materialize.t) => O.some(transaction[expression.field]);
    case "StringLiteral":
      return (transaction: Transaction.Materialize.t) => O.some(expression.value);
  }
}

const buildNumberExpression = (expression: Rule.Internal.Expression.NumberExpression): EvaluateTo<O.Option<number>> => {
  switch (expression._type) {
    case "Add":
      const addLeft = buildNumberExpression(expression.left);
      const addRight = buildNumberExpression(expression.right);
      return (transaction: Transaction.Materialize.t) => {
        return pipe(
            O.Do
          , O.bind('left', () => addLeft(transaction))
          , O.bind('right', () => addRight(transaction))
          , O.map(({ left, right }) => left + right)
        );
      };
    case "Sub":
      const subLeft = buildNumberExpression(expression.left);
      const subRight = buildNumberExpression(expression.right);
      return (transaction: Transaction.Materialize.t) => {
        return pipe(
            O.Do
          , O.bind('left', () => subLeft(transaction))
          , O.bind('right', () => subRight(transaction))
          , O.map(({ left, right }) => left - right)
        );
      };
    case "Mul":
      const mulLeft = buildNumberExpression(expression.left);
      const mulRight = buildNumberExpression(expression.right);
      return (transaction: Transaction.Materialize.t) => {
        return pipe(
            O.Do
          , O.bind('left', () => mulLeft(transaction))
          , O.bind('right', () => mulRight(transaction))
          , O.map(({ left, right }) => left * right)
        );
      };
    case "Div":
      const divLeft = buildNumberExpression(expression.left);
      const divRight = buildNumberExpression(expression.right);
      return (transaction: Transaction.Materialize.t) => {
        return pipe(
            O.Do
          , O.bind('left', () => divLeft(transaction))
          , O.bind('right', () => divRight(transaction))
          , O.map(({ left, right }) => left / right)
        );
      };
    case "Exp":
      const expTerm = buildNumberExpression(expression.term);
      const expPower = buildNumberExpression(expression.power);
      return (transaction: Transaction.Materialize.t) => {
        return pipe(
            O.Do
          , O.bind('term', () => expTerm(transaction))
          , O.bind('power', () => expPower(transaction))
          , O.map(({ term, power }) => Math.pow(term, power))
        );
      };
    case "NumberReference":
      return (transaction: Transaction.Materialize.t) => {
        const value = transaction[expression.field]
        if (typeof value == 'number') {
          return O.some(value);
        } else {
          return value;
        }
      };
    case "NumberLiteral":
      return (transaction: Transaction.Materialize.t) => O.some(expression.value);
  }
}

const buildExpression = (expression: Rule.Internal.Expression.t): EvaluateTo<O.Option<string>> => {
  switch (expression._type) {
    case "Add":
    case "Sub":
    case "Mul":
    case "Div":
    case "Exp":
    case "NumberReference":
    case "NumberLiteral":
      const numberExpression = buildNumberExpression(expression);
      return (transaction: Transaction.Materialize.t) => {
        return pipe(
            numberExpression(transaction)
          , O.map((value) => String(value))
        );
      };
    case "Concat":
    case "StringReference":
    case "StringLiteral":
      return buildStringExpression(expression);
  }
}

const buildInclude = (rule: Rule.Internal.Include): Predicate => {
  return buildClause(rule.clause);
}

const buildUpdateString = (rule: Rule.Internal.UpdateString): Materializer => {
  const where = buildClause(rule.where);
  const expression = buildStringExpression(rule.expression);
  return (transaction: Transaction.Materialize.t) => {
    return O.map((value: string) => withString(transaction, rule.field, value))(expression(transaction))
  };
}

const buildUpdateNumber = (rule: Rule.Internal.UpdateNumber): Materializer => {
  const where = buildClause(rule.where);
  const expression = buildNumberExpression(rule.expression);
  return (transaction: Transaction.Materialize.t) => {
    return O.map((value: number) => withNumber(transaction, rule.field, value))(expression(transaction))
  };
}

const buildUpdate = (rule: Rule.Internal.Update): Materializer => {
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
  return (transaction: Transaction.Materialize.t) => pipe(
      includeMaterializers
    , A.reduce(O.none, (out: O.Option<Transaction.Materialize.t>, materializer) => O.match( // JK: construct an "or" of includes (a DNF)
          () => {
            if (materializer(transaction)) {
              return O.some(transaction);
            } else {
              return O.none;
            }
          }
        , (_) => O.some(transaction)
      )(out))
    , O.chain((transaction) => 
        A.reduce(O.some(transaction), (transaction: O.Option<Transaction.Materialize.t>, materializer: Materializer) =>
          O.chain(materializer)(transaction)
        )(updateMaterializers)
      )
  );
}

export const build = (plan: Plan.t): Materializer => {
  return (transaction: Transaction.Materialize.t) => pipe(
      plan.stages
    , A.map(buildStage)
    , A.reduce(O.some(transaction), (transaction, materializer) => pipe(transaction, O.map(materializer), O.flatten))
  );
}
