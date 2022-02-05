import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { TransactionEntry } from "../entry/transaction-entry";

import { Transaction } from "model";
import { Exception } from "magic";

export namespace TransactionFrontend {
  export const all = (userEmail: string): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    return TransactionEntry.allByUser(userEmail);
  };

  export const createAll =
    (userEmail: string) =>
    (transactions: Transaction.Internal.t[]): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    return TransactionEntry.insertAll(userEmail)(transactions);
  };
}

export default TransactionFrontend;
