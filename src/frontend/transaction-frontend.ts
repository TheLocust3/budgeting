import { Pool } from 'pg';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import * as Transaction from '../model/transaction';
import * as TransactionsTable from '../db/transactions';
import { throwNotFound, throwInternalError, Exception } from '../exception';

export namespace TransactionFrontend {
  export const all = (pool: Pool) => (): TE.TaskEither<Exception, Transaction.Internal.t[]> => {
    return pipe(
        TransactionsTable.all(pool)()
      , TE.mapLeft((_) => throwInternalError)
    );
  }

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception, Transaction.Internal.t> => {
    return pipe(
        id
      , TransactionsTable.byId(pool)
      , TE.mapLeft((_) => throwInternalError)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception, Transaction.Internal.t> => TE.throwError(throwNotFound)
          , (rule) => TE.of(rule)
        ))
    );
  }

  export const create = (pool: Pool) => (transaction: Transaction.Internal.t): TE.TaskEither<Exception, Transaction.Internal.t> => {
    return pipe(
        transaction
      , TransactionsTable.create(pool)
      , TE.mapLeft((_) => throwInternalError)
    );
  }

  export const deleteById = (pool: Pool) => (id: string): TE.TaskEither<Exception, void> => {
    return pipe(
        id
      , TransactionsTable.deleteById(pool)
      , TE.mapLeft((_) => throwInternalError)
    );
  }
}

export default TransactionFrontend;
