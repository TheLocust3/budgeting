import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import EngineChannel from '../channel/engine-channel';

import { Account } from "model";
import { Channel, Exception } from "magic";

export namespace AccountFrontend {
  export const all = (userEmail: string): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    return pipe(
        EngineChannel.push(`/accounts?userEmail=${userEmail}`)('GET')()
      , Channel.to(Account.Channel.Response.AccountList.Json.from)
      , TE.map(({ accounts }) => accounts)
    );
  };

  export const getById = (userEmail: string) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        EngineChannel.push(`/accounts/${id}?userEmail=${userEmail}`)('GET')()
      , Channel.to(Account.Internal.Json.from)
    );
  };

  // TODO: JK create any given rules
  export const create =
    (userEmail: string) =>
    (parentId: string) =>
    (account: Account.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        { name: account.name }
      , Account.Channel.Request.Create.Json.to
      , O.some
      , EngineChannel.push(`/accounts?userEmail=${userEmail}&parentId=${parentId}`)('POST')
      , Channel.to(Account.Internal.Json.from)
    );
  };

  export const deleteById = (userEmail: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        EngineChannel.push(`/accounts/${id}?userEmail=${userEmail}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default AccountFrontend;
