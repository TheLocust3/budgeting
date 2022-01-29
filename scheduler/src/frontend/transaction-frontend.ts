import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Transaction } from "model";
import * as TransactionsTable from "../db/transactions-table";
import { Exception } from "magic";

export namespace TransactionFrontend {
  export const create = (pool: Pool) => (transaction: Transaction.Internal.t): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        transaction
      , TransactionsTable.create(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  };
}

export default TransactionFrontend;
