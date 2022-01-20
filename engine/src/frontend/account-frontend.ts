import { Pool } from 'pg';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import RuleFrontend from './rule-frontend';

import { Account } from 'model';
import * as AccountsTable from '../db/accounts';
import { Exception } from 'magic';

export namespace AccountFrontend {
  export const all = (pool: Pool) => (): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    return pipe(
        AccountsTable.all(pool)()
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        id
      , AccountsTable.byId(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Account.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (account) => TE.of(account)
        ))
    );
  }

  export const withRules = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        account.id
      , O.match(() => <TE.TaskEither<Exception.t, string>>TE.throwError(Exception.throwInternalError), (id) => TE.of(id))
      , TE.chain(RuleFrontend.getByAccountId(pool))
      , TE.map((rules) => { return { ...account, rules: rules }; })
    );
  }

  export const withChildren = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        account.id
      , O.match(() => <TE.TaskEither<Exception.t, string>>TE.throwError(Exception.throwInternalError), (id) => TE.of(id))
      , TE.chain((id) => pipe(id, AccountsTable.childrenOf(pool), TE.mapLeft((_) => Exception.throwInternalError)))
      , TE.map((children) => { return { ...account, children: children }; })
    );
  }

  export const create = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        account
      , AccountsTable.create(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }

  export const deleteById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , AccountsTable.deleteById(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }
}

export default AccountFrontend;
