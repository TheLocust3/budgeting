import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/Either';

import * as Transaction from '../model/transaction';
import * as Plan from './plan';

// TODO: JK
export const materialize = (plan: Plan.t): E.Either<Error, Transaction.Internal.t[]> => {
  return E.right([]);
}