import { Pool } from 'pg';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import * as Transaction from '../model/transaction';
import * as TransactionsTable from '../db/transactions';
import { Exception } from 'magic';

export namespace TransactionFrontend {
  export const all = (pool: Pool) => (): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    return pipe(
        TransactionsTable.all(pool)()
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        id
      , TransactionsTable.byId(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Transaction.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (rule) => TE.of(rule)
        ))
    );
  }

  export const create = (pool: Pool) => (transaction: Transaction.Internal.t): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        transaction
      , TransactionsTable.create(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }

  export const deleteById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , TransactionsTable.deleteById(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }
}

export default TransactionFrontend;
