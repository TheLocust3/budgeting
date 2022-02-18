import Express from "express";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { toPromise } from "./util";
import AccountChannel from "../channel/account-channel";
import { PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../constants";

import { User, Account, Rule, Materialize } from "model";
import { Exception } from "magic";

type Resolvable<T> = O.Option<Promise<T>>;

export type t = {
  user: User.Internal.t;
  physical: Resolvable<AccountContext>;
  virtual: Resolvable<AccountContext>;
}

type ResolvableField = "physical" | "virtual";

const resolve =
  (context: t) =>
  <T>(get: (context: t) => Resolvable<T>) =>
  (set: (value: Resolvable<T>) => (context: t) => void) =>
  (resolver: (context: t) => TE.TaskEither<Exception.t, T>): TE.TaskEither<Exception.t, T> => {
  return O.match(
      () => {
        const out = resolver(context);
        set(O.some(toPromise(out)))(context);
        return out;
      }
    , (value: Promise<T>) => TE.tryCatch(() => value, () => Exception.throwInternalError)
  )(get(context))
}

type AccountContext = {
  account: Account.Internal.t;
  children: AccountContext[];
}

type Context = t; // an alias for the below definitions

export namespace AccountContext {
  export type t = {
    account: Account.Internal.t;
    children: AccountContext[];
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

  export const resolver = 
    (name: string) =>
    (context: Context): TE.TaskEither<Exception.t, t> => {
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
      , TE.bind("allAccounts", () => AccountChannel.all(context.user.id))
      , TE.bind("account", ({ allAccounts }) => forName(name)(allAccounts))
      , TE.map(({ allAccounts, account }) => {
          return build(allAccounts)(account);
        })
    );
  }
}

export const resolvePhysical = (context: t): TE.TaskEither<Exception.t, AccountContext> => {
  const get = (context: t) => { return context.physical };
  const set = (value: Resolvable<AccountContext>) => (context: t) => { context.physical = value };

  return resolve(context)(get)(set)(AccountContext.resolver(PHYSICAL_ACCOUNT))
}

export const resolveVirtual = (context: t): TE.TaskEither<Exception.t, AccountContext> => {
  const get = (context: t) => { return context.virtual };
  const set = (value: Resolvable<AccountContext>) => (context: t) => { context.virtual = value };

  return resolve(context)(get)(set)(AccountContext.resolver(VIRTUAL_ACCOUNT))
}

export const empty = (response: any) => {
  return {
      user: response.locals.user
    , physical: O.none
    , virtual: O.none
  }
}
