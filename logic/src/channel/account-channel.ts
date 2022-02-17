import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import EngineChannel from './engine-channel';

import { Account, Materialize } from "model";
import { Channel, Exception } from "magic";

export namespace AccountChannel {
  export const all = (userId: string): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    return pipe(
        EngineChannel.push(`/accounts?userId=${userId}`)('GET')()
      , Channel.to(Account.Channel.Response.AccountList.Json.from)
      , TE.map(({ accounts }) => accounts)
    );
  };

  export const getById = (userId: string) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        EngineChannel.push(`/accounts/${id}?userId=${userId}`)('GET')()
      , Channel.to(Account.Internal.Json.from)
    );
  };

  // TODO: JK create any given rules
  export const create = (account: Account.Frontend.Create.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        { parentId: account.parentId, userId: account.userId, name: account.name }
      , Account.Frontend.Create.Json.to
      , O.some
      , EngineChannel.push(`/accounts/`)('POST')
      , Channel.to(Account.Internal.Json.from)
    );
  };

  export const deleteById = (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        EngineChannel.push(`/accounts/${id}?userId=${userId}`)('DELETE')()
      , Channel.toVoid
    );
  };

  export const materialize = (userId: string) => (id: string): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
    return pipe(
        EngineChannel.push(`/accounts/${id}/materialize?userId=${userId}`)('GET')()
      , Channel.to(Materialize.Internal.Json.from)
    );
  };
}

export default AccountChannel;
