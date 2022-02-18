import Express from "express";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { toPromise, fromPromise } from "./util";
import AccountChannel from "../channel/account-channel";
import RuleChannel from "../channel/rule-channel";
import { PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../constants";

import { User, Account, Rule, Materialize } from "model";
import { Exception } from "magic";

type Resolvable<T> = O.Option<Promise<T>>;

export type t = {
  user: User.Internal.t;
  physical: { account: Resolvable<AccountContext>; transactions: Resolvable<Materialize.Internal.t>; };
  virtual: { account: Resolvable<AccountContext>; rules: Resolvable<Rule.Internal.t[]>; transactions: Resolvable<Materialize.Internal.t>; };
}

type ResolvableField = "physical" | "virtual";

const resolve =
  (context: t) =>
  <T>(get: (context: t) => Resolvable<T>) =>
  (set: (value: Resolvable<T>) => (context: t) => void) =>
  (resolver: (context: t) => TE.TaskEither<Exception.t, T>): TE.TaskEither<Exception.t, T> => {
  return O.match(
      () => {
        const out = toPromise(resolver(context));
        set(O.some(out))(context);
        return fromPromise(out); // a silly jig to make sure this task only evaluates _once_
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

export namespace TransactionContext {
  export const resolver = 
    (accountId: string) =>
    (context: Context): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
    return AccountChannel.materialize(context.user.id)(accountId);
  }
}

export namespace RuleContext {
  export const resolver = 
    (accountId: string) =>
    (context: Context): TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
    return RuleChannel.all(accountId);
  }
}

export const physical = (context: t): TE.TaskEither<Exception.t, AccountContext> => {
  const get = (context: t) => { return context.physical.account };
  const set = (value: Resolvable<AccountContext>) => (context: t) => { context.physical.account = value };

  return resolve(context)(get)(set)(AccountContext.resolver(PHYSICAL_ACCOUNT))
}

export const materializePhysical = (context: t): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
  const get = (context: t) => { return context.physical.transactions };
  const set = (value: Resolvable<Materialize.Internal.t>) => (context: t) => { context.physical.transactions = value };

  return pipe(
      physical(context)
    , TE.chain((physical) => resolve(context)(get)(set)(TransactionContext.resolver(physical.account.id)))
  );
}

export const virtual = (context: t): TE.TaskEither<Exception.t, AccountContext> => {
  const get = (context: t) => { return context.virtual.account };
  const set = (value: Resolvable<AccountContext>) => (context: t) => { context.virtual.account = value };

  return resolve(context)(get)(set)(AccountContext.resolver(VIRTUAL_ACCOUNT))
}

export const virtualRules = (context: t): TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
  const get = (context: t) => { return context.virtual.rules };
  const set = (value: Resolvable<Rule.Internal.t[]>) => (context: t) => { context.virtual.rules = value };

  return pipe(
      virtual(context)
    , TE.chain((virtual) => resolve(context)(get)(set)(RuleContext.resolver(virtual.account.id)))
  );
}

export const materializeVirtual = (context: t): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
  const get = (context: t) => { return context.virtual.transactions };
  const set = (value: Resolvable<Materialize.Internal.t>) => (context: t) => { context.virtual.transactions = value };

  return pipe(
      virtual(context)
    , TE.chain((virtual) => resolve(context)(get)(set)(TransactionContext.resolver(virtual.account.id)))
  );
}

export const empty = (response: any) => {
  return {
      user: response.locals.user
    , physical: { account: O.none, transactions: O.none }
    , virtual: { account: O.none, transactions: O.none }
  }
}
