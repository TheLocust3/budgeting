import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Transaction } from "../../model";
import * as TransactionsTable from "../db/transactions-table";
import { Exception } from "../../magic";

export namespace TransactionFrontend {
  export const all = (pool: Pool) => (log: Logger) => (userId: string): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    return TransactionsTable.all(pool)(log)(userId);
  };

  export const getById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        id
      , TransactionsTable.byId(pool)(log)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Transaction.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (rule) => TE.of(rule)
        ))
      , TE.chain((transaction) => {
          if (transaction.userId == userId) {
            return TE.of(transaction);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const create = (pool: Pool) => (log: Logger) => (transaction: Transaction.Frontend.Create.t): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        transaction
      , TransactionsTable.create(pool)(log)
    );
  };

  export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , TransactionsTable.deleteById(pool)(log)(userId)
    );
  };
}

export default TransactionFrontend;
