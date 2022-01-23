import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import EngineChannel from '../channel/engine-channel';
import { Channel } from '../channel/util';

import { Transaction } from "model";
import { Exception } from "magic";

export namespace TransactionFrontend {
  export const all = (userId: string): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    return pipe(
        EngineChannel.push(`/transactions?userId=${userId}`)('GET')()
      , TE.map((response) => response.transactions)
      , Channel.toArrayOf(Transaction.Channel.Response.from)
    );
  };

  export const getById = (userId: string) => (id: string): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        EngineChannel.push(`/transactions/${id}?userId=${userId}`)('GET')()
      , Channel.to(Transaction.Channel.Response.from)
    );
  };

  export const create = (account: Transaction.Internal.t): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
    return pipe(
        EngineChannel.push(`/transactions/`)('POST')(O.some(Transaction.Channel.Request.to(account)))
      , Channel.to(Transaction.Channel.Response.from)
    );
  };

  export const deleteById = (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        EngineChannel.push(`/transactions/${id}?userId=${userId}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default TransactionFrontend;
