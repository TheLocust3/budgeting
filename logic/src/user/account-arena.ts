import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Arena from "./arena";
import AccountChannel from "../channel/account-channel";

import { User, Account, Rule, Materialize } from "model";
import { Exception } from "magic";

export type t = {
  account: Account.Internal.t;
  children: t[];
}

const build = (accounts: Account.Internal.t[]) => (forAccount: Account.Internal.t): t => {
  const isParentOf = (account: Account.Internal.t): boolean => {
    return O.match(
        () => false
      , (parentId) => parentId === forAccount.id
    )(account.parentId);
  }

  return {
      account: forAccount
    , children: pipe(accounts, A.filter((account) => isParentOf(account)), A.map(build(accounts)))
  }
}

export const resolve = 
  (name: string) =>
  (arena: Arena.t): TE.TaskEither<Exception.t, t> => {
  const forName = (name: string) => (accounts: Account.Internal.t[]): TE.TaskEither<Exception.t, Account.Internal.t> => {
    const matching = A.filter((account: Account.Internal.t) => account.name === name)(accounts);

    if (matching.length === 0) {
      return TE.throwError(Exception.throwNotFound);
    } else {
      return TE.of(matching[0]);
    }
  }

  return pipe(
      TE.Do
    , TE.bind("allAccounts", () => AccountChannel.all(arena.user.id))
    , TE.bind("account", ({ allAccounts }) => forName(name)(allAccounts))
    , TE.map(({ allAccounts, account }) => {
        return build(allAccounts)(account);
      })
  );
}


