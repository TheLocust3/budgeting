import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import * as TransactionsTable from '../db/transactions';
import * as Transaction from '../model/transaction';
import * as Account from '../model/account';
import * as Plan from './plan';
import * as Schema from './schema';
import * as Materializer from './materializer';
import { Array } from '../model/util';

export const materialize = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Error, Transaction.Materialize.t[]> => {
  // TODO: JK track materialize logs with id
  console.log(`materialize - starting for account ${JSON.stringify(account, null, 2)}}`);
  
  const plan = Plan.build(account);
  console.log(`materialize - with plan ${JSON.stringify(plan, null, 2)}`);

  return pipe(
      plan
    , Schema.validate
    , E.map(Materializer.build)
    , TE.fromEither
    , TE.chain((materializer) => {
        return pipe(
            TransactionsTable.all(pool)()
          , TE.map(A.map(Transaction.Materialize.from))
          , TE.map(A.map(materializer))
          , TE.map(Array.flattenOption)
        )
      })
  );
}