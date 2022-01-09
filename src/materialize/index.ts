import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import * as Transaction from '../model/transaction';
import * as Account from '../model/account';
import * as Plan from './plan';
import * as Schema from './schema';
import * as Execute from './execute';

export const materialize = (account: Account.Internal.t): E.Either<Error, Transaction.Internal.t[]> => {
  // TODO: JK track materialize logs with id
  console.log(`materialize - starting for account ${JSON.stringify(account, null, 2)}}`);
  
  const plan = Plan.build(account);
  console.log(`materialize - with plan ${JSON.stringify(plan, null, 2)}`);

  return pipe(
      plan
    , Schema.validate
    , E.chain(Execute.materialize)
  );
}