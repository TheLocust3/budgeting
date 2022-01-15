import { Pool } from 'pg';
import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import TransactionFrontend from '../frontend/transaction-frontend';
import AccountFrontend from '../frontend/account-frontend';
import RuleFrontend from '../frontend/rule-frontend';

import * as AccountsTable from '../db/accounts';
import * as TransactionsTable from '../db/transactions';
import * as RulesTable from '../db/rules';
import * as Transaction from '../model/transaction';
import * as Rule from '../model/rule';
import * as Account from '../model/account';
import * as Plan from './plan';
import * as Materializer from './materializer';
import { Array } from '../model/util';
import { Exception } from '../exception';

type Materialized = {
    transactions: Transaction.Materialize.t[];
    conflicts: {
      transaction: Transaction.Materialize.t;
      rules: Rule.Internal.Update[];
    }[];
}

const linkedAccounts = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Exception, Account.Internal.t[]> => {
  return O.match(
      () => TE.of([])
    , (parentId: string) => pipe(
          TE.Do
        , TE.bind('parent', () => AccountFrontend.getByIdWithRules(pool)(parentId))
        , TE.bind('rest', ({ parent }) => linkedAccounts(pool)(parent))
        , TE.map(({ parent, rest }) => rest.concat(parent))
      )
  )(account.parentId);
}

export const materialize = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Exception, Materialized> => {
  // TODO: JK track materialize logs with id
  console.log(`materialize - starting for account ${JSON.stringify(account, null, 2)}}`);
  
  return pipe(
      account
    , linkedAccounts(pool)
    , TE.chain((accounts) => {
        const plan = Plan.build(accounts.concat(account));
        console.log(`materialize - with plan ${JSON.stringify(plan, null, 2)}`);

        const materializer = Materializer.build(plan);
        return pipe(
            TransactionFrontend.all(pool)()
          , TE.map(A.map(Transaction.Materialize.from))
          , TE.map(A.map(materializer))
          , TE.map(Array.flattenOption)
          , TE.map(A.reduce(<Materialized>{ transactions: [], conflicts: []}, ({ transactions, conflicts }, element) => {
              switch (element._type) {
                case 'Conflict':
                return {
                    transactions: transactions
                  , conflicts: conflicts.concat({ transaction: element.transaction, rules: element.rules })
                };
                case 'Wrapper':
                  return { transactions: transactions.concat(element.transaction), conflicts: conflicts };
              }
            }))
        );
      })
  );
}