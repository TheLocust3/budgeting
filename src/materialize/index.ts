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

export type t = {
  conflicts: Materializer.Conflict[];
  tagged: { tag: string, elements: Transaction.Materialize.t[] }[];
  untagged: Transaction.Materialize.t[];
};

export namespace Json {
  namespace Conflict {
    export const to = (conflict: Materializer.Conflict): any => {
      return {
          element: pipe(conflict.element, Transaction.Materialize.to, Transaction.Json.to)
        , rules: pipe(conflict.rules, A.map(Rule.Json.to))
      };
    }
  }

  namespace Tagged {
    export const to = ({ tag, elements }: { tag: string, elements: Transaction.Materialize.t[] }): any => {
      return {
          tag: tag
        , elements: pipe(elements, A.map(Transaction.Materialize.to), A.map(Transaction.Json.to))
      };
    }
  }

  export const to = (materialized: t): any => {
    return {
        conflicts: A.map(Conflict.to)(materialized.conflicts)
      , tagged: A.map(Tagged.to)(materialized.tagged)
      , untagged: pipe(materialized.untagged, A.map(Transaction.Materialize.to), A.map(Transaction.Json.to))
    }
  }
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

export const execute = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Exception, t> => {
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
          , TE.map(A.reduce(<t>{ conflicts: [], tagged: [], untagged: [] }, ({ conflicts, tagged, untagged }, element) => { // TODO: JK need to initialize tagged array
              return O.match(
                  () => { return { conflicts, tagged, untagged }; }
                , (element: Materializer.Element) => {
                    switch (element._type) {
                      case "Conflict":
                        return { conflicts: conflicts.concat(element), tagged: tagged, untagged: untagged };
                      case "Tagged":
                        const newTagged = A.map(({ tag, elements }: { tag: string, elements: Transaction.Materialize.t[] }) => {
                          if (tag == element.tag) {
                            return { tag: tag, elements: elements.concat(element.element) };
                          } else {
                            return { tag: tag, elements: elements };
                          }
                        })(tagged)

                        return { conflicts: conflicts, tagged: newTagged, untagged: untagged };
                      case "Untagged":
                        return { conflicts: conflicts, tagged: tagged, untagged: untagged.concat(element.element) };
                    }
                  }
              )(element)
            }))
        );
      })
  );
}