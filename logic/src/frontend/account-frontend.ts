import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import EngineChannel from '../channel/engine-channel';
import { Channel } from '../channel/util';

import { Account } from "model";
import { Exception } from "magic";

export namespace AccountFrontend {
  export const all = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    return pipe(
        EngineChannel.push(`/accounts?userId=${userId}`)('GET')()
      , Channel.toArrayOf(Account.Channel.Response.from)
    );
  };

  export const getById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        EngineChannel.push(`/accounts/${id}?userId=${userId}`)('GET')()
      , Channel.to(Account.Channel.Response.from)
    );
  };

  export const create = (pool: Pool) => (account: Account.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        EngineChannel.push(`/accounts/`)('POST')(O.some(Account.Channel.Request.to(account)))
      , Channel.to(Account.Channel.Response.from)
    );
  };

  export const deleteById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        EngineChannel.push(`/accounts/${id}?userId=${userId}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default AccountFrontend;
