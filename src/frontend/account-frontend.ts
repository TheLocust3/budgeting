import { Pool } from 'pg';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import * as Account from '../model/account';
import * as AccountsTable from '../db/accounts';
import { throwNotFound, throwInternalError, Exception } from '../exception';

export namespace AccountFrontend {
  export const getByGroupId = (pool: Pool) => (groupId: string): TE.TaskEither<Exception, Account.Internal.t[]> => {
    return pipe(
        groupId
      , AccountsTable.byGroupId(pool)
      , TE.mapLeft((_) => throwInternalError)
    );
  }

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception, Account.Internal.t> => {
    return pipe(
        id
      , AccountsTable.byId(pool)
      , TE.mapLeft((_) => throwInternalError)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception, Account.Internal.t> => TE.throwError(throwNotFound)
          , (account) => TE.of(account)
        ))
    );
  }

  export const create = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Exception, Account.Internal.t> => {
    return pipe(
        account
      , AccountsTable.create(pool)
      , TE.mapLeft((_) => throwInternalError)
    );
  }

  export const deleteById = (pool: Pool) => (id: string): TE.TaskEither<Exception, void> => {
    return pipe(
        id
      , AccountsTable.deleteById(pool)
      , TE.mapLeft((_) => throwInternalError)
    );
  }
}

export default AccountFrontend;
