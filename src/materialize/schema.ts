import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/Either';

import * as Plan from './plan';

// TODO: JK
export const validate = (plan: Plan.t): E.Either<Error, Plan.t> => {
  return E.right(plan);
}