import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import EngineChannel from '../channel/engine-channel';

import { Transaction } from "../../model";
import { Channel, Exception } from "../../magic";

export namespace TransactionChannel {
  export const all = (userId: string): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    return pipe(
        EngineChannel.push(`/transactions?userId=${userId}`)('GET')()
      , Channel.to(Transaction.Channel.Response.TransactionList.Json.from)
      , TE.map(({ transactions }) => transactions)
    );
  };

  export const getById = (userId: string) => (id: string): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        EngineChannel.push(`/transactions/${id}?userId=${userId}`)('GET')()
      , Channel.to(Transaction.Internal.Json.from)
    );
  };

  export const create = (transaction: Transaction.Frontend.Create.t): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        { ...transaction, authorizedAt: transaction.authorizedAt.getTime(), capturedAt: O.map((capturedAt: Date) => capturedAt.getTime())(transaction.capturedAt) }
      , Transaction.Channel.Request.Create.Json.to
      , O.some
      , EngineChannel.push(`/transactions/`)('POST')
      , Channel.to(Transaction.Internal.Json.from)
    );
  };

  export const deleteById = (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        EngineChannel.push(`/transactions/${id}?userId=${userId}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default TransactionChannel;
