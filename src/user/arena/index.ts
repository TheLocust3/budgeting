import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../util";
import * as AccountArena from "./account-arena";
import * as RuleArena from "./rule-arena";
import * as TransactionArena from "./transaction-arena";
import * as IntegrationArena from "./integration-arena";

import { User } from "../../model";
import { UserFrontend } from "../../storage";
import { Exception, Pipe } from "../../magic";

type Resolvable<T> = O.Option<Promise<T>>;

export namespace Layer {
  export type t = {
    account: Resolvable<AccountArena.t>;
    rules: Resolvable<RuleArena.t>;
    transactions: Resolvable<TransactionArena.t>;
  }
}

export type t = {
  user: User.Internal.t;
  physical: Layer.t;
  virtual: Layer.t;
  integrations: Resolvable<IntegrationArena.t>;
}

const resolve =
  (arena: t) =>
  <T>(get: (arena: t) => Resolvable<T>) =>
  (set: (value: Resolvable<T>) => (arena: t) => void) =>
  (resolver: (arena: t) => TE.TaskEither<Exception.t, T>): TE.TaskEither<Exception.t, T> => {
  return O.match(
      () => {
        const out = Pipe.toPromise(resolver(arena));
        set(O.some(out))(arena);
        return Pipe.fromPromise(out); // a silly jig to make sure this task only evaluates _once_
      }
    , (value: Promise<T>) => TE.tryCatch(() => value, () => Exception.throwInternalError)
  )(get(arena))
}

export const physical = (arena: t): TE.TaskEither<Exception.t, AccountArena.t> => {
  const get = (arena: t) => { return arena.physical.account };
  const set = (value: Resolvable<AccountArena.t>) => (arena: t) => { arena.physical.account = value };

  return resolve(arena)(get)(set)(AccountArena.resolve(PHYSICAL_ACCOUNT))
}

export const materializePhysical = (arena: t): TE.TaskEither<Exception.t, TransactionArena.t> => {
  const get = (arena: t) => { return arena.physical.transactions };
  const set = (value: Resolvable<TransactionArena.t>) => (arena: t) => { arena.physical.transactions = value };

  return pipe(
      physical(arena)
    , TE.chain((physical) => resolve(arena)(get)(set)(TransactionArena.resolve(physical.account.id)))
  );
}

export const virtual = (arena: t): TE.TaskEither<Exception.t, AccountArena.t> => {
  const get = (arena: t) => { return arena.virtual.account };
  const set = (value: Resolvable<AccountArena.t>) => (arena: t) => { arena.virtual.account = value };

  return resolve(arena)(get)(set)(AccountArena.resolve(VIRTUAL_ACCOUNT))
}

export const virtualRules = (arena: t): TE.TaskEither<Exception.t, RuleArena.t> => {
  const get = (arena: t) => { return arena.virtual.rules };
  const set = (value: Resolvable<RuleArena.t>) => (arena: t) => { arena.virtual.rules = value };

  return pipe(
      virtual(arena)
    , TE.chain((virtual) => resolve(arena)(get)(set)(RuleArena.resolve(virtual.account.id)))
  );
}

export const materializeVirtual = (arena: t): TE.TaskEither<Exception.t, TransactionArena.t> => {
  const get = (arena: t) => { return arena.virtual.transactions };
  const set = (value: Resolvable<TransactionArena.t>) => (arena: t) => { arena.virtual.transactions = value };

  return pipe(
      virtual(arena)
    , TE.chain((virtual) => resolve(arena)(get)(set)(TransactionArena.resolve(virtual.account.id)))
  );
}

export const integrations = (pool: Pool) => (arena: t): TE.TaskEither<Exception.t, IntegrationArena.t> => {
  const get = (arena: t) => { return arena.integrations };
  const set = (value: Resolvable<IntegrationArena.t>) => (arena: t) => { arena.integrations = value };

  return resolve(arena)(get)(set)(IntegrationArena.resolve(pool))
}

export const empty = (user: User.Internal.t): t => {
  return {
      user: user
    , physical: { account: O.none, rules: O.none, transactions: O.none }
    , virtual: { account: O.none, rules: O.none, transactions: O.none }
    , integrations: O.none
  }
}

export const fromId = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, t> => {
  return pipe(
      UserFrontend.getById(pool)(userId)
    , TE.map(empty)
  );
}

export * as Account from "./account-arena";
export * as Rule from "./rule-arena";
export * as Transaction from "./transaction-arena";
export * as Integrations from "./integration-arena";
