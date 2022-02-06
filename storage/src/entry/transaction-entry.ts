import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Entry } from "./entry";
import { UserEntry } from "./user-entry";
import { rootPath, hash, passthrough, Writers } from "./util";

import { Transaction } from "model";
import { Exception, Format } from "magic";

export namespace TransactionEntry {
  namespace Storage {
    const t = iot.type({
      transactions: iot.array(Transaction.Internal.t)
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
  }

  const entry = new Entry(passthrough, { root: rootPath, name: "transactions", format: Storage.Json });

  const storageWriter = Writers.orDefaultWriter<Storage.t>({ transactions: [] });

  export const allByUser = (userEmail: string): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    const objectId = UserEntry.idFor(userEmail);

    return pipe(
        entry.getObject(objectId)
      , TE.map((stored) => stored.transactions)
    );
  }

  export const insertAll =
    (userEmail: string) =>
    (transactions: Transaction.Internal.t[]): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    const toInsert = new Set(A.map((transaction: Transaction.Internal.t) => transaction.id)(transactions));

    const objectId = UserEntry.idFor(userEmail);
    const writer = storageWriter((saved: Storage.t) => {
      const outTransactions = A.filter((savedTransaction: Transaction.Internal.t) => {
        return !toInsert.has(savedTransaction.id);
      })(saved.transactions)

      A.map((transaction: Transaction.Internal.t) => outTransactions.push(transaction))(transactions)

      return { transactions: outTransactions };
    })

    return pipe(
        entry.putObject(objectId)(writer)
      , TE.map(() => transactions)
    );
  }
}
