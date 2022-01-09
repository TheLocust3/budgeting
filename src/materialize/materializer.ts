import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/Either';

import * as Transaction from '../model/transaction';
import * as Plan from './plan';

type Materializer = (transaction: Transaction.Internal.t) => Transaction.Internal.t;

// TODO: JK
export const build = (plan: Plan.t): Materializer => {
  return (transaction: Transaction.Internal.t) => transaction
}