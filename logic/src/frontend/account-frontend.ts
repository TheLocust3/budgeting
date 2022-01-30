import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import EngineChannel from '../channel/engine-channel';

import { Account } from "model";
import { Channel, Exception } from "magic";

export namespace AccountFrontend {
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
  export const create = (account: Account.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        { parentId: account.parentId, userId: account.userId, name: account.name }
      , Account.Channel.Request.Create.Json.to
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
}

export default AccountFrontend;
