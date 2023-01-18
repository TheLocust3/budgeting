import { Pool } from "pg";
import { Logger } from "pino";
import { v5 as uuid } from 'uuid';
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
import * as NotificationArena from "./notification-arena";
import * as TemplateArena from "./template-arena";

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
  id: string;
  user: User.Internal.t;
  physical: Layer.t;
  virtual: Layer.t;
  integrations: Resolvable<IntegrationArena.t>;
  notifications: Resolvable<NotificationArena.t>;
  templates: Record<string, Resolvable<TemplateArena.t>>;
}

const resolve =
  (log : Logger) =>
  (arena: t) =>
  <T>(get: (arena: t) => Resolvable<T>) =>
  (set: (value: Resolvable<T>) => (arena: t) => void) =>
  (resolver: (arena: t) => TE.TaskEither<Exception.t, T>): TE.TaskEither<Exception.t, T> => {
  return O.match(
      () => {
        const out = Pipe.toPromise(resolver(arena));
        set(O.some(out))(arena);
        return Pipe.fromPromise(log)(out); // a silly jig to make sure this task only evaluates _once_
      }
    , (value: Promise<T>) => TE.tryCatch(() => value, Exception.throwInternalError)
  )(get(arena))
}

export const physical = (pool: Pool) => (log : Logger) => (arena: t): TE.TaskEither<Exception.t, AccountArena.t> => {
  const get = (arena: t) => { return arena.physical.account };
  const set = (value: Resolvable<AccountArena.t>) => (arena: t) => { arena.physical.account = value };

  return resolve(log)(arena)(get)(set)(AccountArena.resolve(pool)(log)(PHYSICAL_ACCOUNT))
}

export const materializePhysical = (pool: Pool) => (log : Logger) => (arena: t): TE.TaskEither<Exception.t, TransactionArena.t> => {
  const get = (arena: t) => { return arena.physical.transactions };
  const set = (value: Resolvable<TransactionArena.t>) => (arena: t) => { arena.physical.transactions = value };

  return pipe(
      physical(pool)(log)(arena)
    , TE.chain((physical) => resolve(log)(arena)(get)(set)(TransactionArena.resolve(pool)(log)(physical.account.id)))
  );
}

export const virtual = (pool: Pool) => (log : Logger) => (arena: t): TE.TaskEither<Exception.t, AccountArena.t> => {
  const get = (arena: t) => { return arena.virtual.account };
  const set = (value: Resolvable<AccountArena.t>) => (arena: t) => { arena.virtual.account = value };

  return resolve(log)(arena)(get)(set)(AccountArena.resolve(pool)(log)(VIRTUAL_ACCOUNT))
}

export const virtualRules = (pool: Pool) => (log : Logger) => (arena: t): TE.TaskEither<Exception.t, RuleArena.t> => {
  const get = (arena: t) => { return arena.virtual.rules };
  const set = (value: Resolvable<RuleArena.t>) => (arena: t) => { arena.virtual.rules = value };

  return pipe(
      virtual(pool)(log)(arena)
    , TE.chain((virtual) => resolve(log)(arena)(get)(set)(RuleArena.resolve(pool)(log)(virtual.account.id)))
  );
}

export const materializeVirtual = (pool: Pool) => (log : Logger) => (arena: t): TE.TaskEither<Exception.t, TransactionArena.t> => {
  const get = (arena: t) => { return arena.virtual.transactions };
  const set = (value: Resolvable<TransactionArena.t>) => (arena: t) => { arena.virtual.transactions = value };

  return pipe(
      virtual(pool)(log)(arena)
    , TE.chain((virtual) => resolve(log)(arena)(get)(set)(TransactionArena.resolve(pool)(log)(virtual.account.id)))
  );
}

export const integrations = (pool: Pool) => (log : Logger) => (arena: t): TE.TaskEither<Exception.t, IntegrationArena.t> => {
  const get = (arena: t) => { return arena.integrations };
  const set = (value: Resolvable<IntegrationArena.t>) => (arena: t) => { arena.integrations = value };

  return resolve(log)(arena)(get)(set)(IntegrationArena.resolve(pool)(log))
}

export const notifications = (pool: Pool) => (log : Logger) => (arena: t): TE.TaskEither<Exception.t, NotificationArena.t> => {
  const get = (arena: t) => { return arena.notifications };
  const set = (value: Resolvable<NotificationArena.t>) => (arena: t) => { arena.notifications = value };

  return resolve(log)(arena)(get)(set)(NotificationArena.resolve(pool)(log))
}

export const templatesFor = (pool: Pool) => (log : Logger) => (arena: t) => (accountId: string): TE.TaskEither<Exception.t, TemplateArena.t> => {
  const get = (arena: t) => {
    const maybe = arena.templates[accountId]
    if (maybe === undefined) {
      return O.none;
    } else {
      return maybe;
    }
  };
  const set = (value: Resolvable<TemplateArena.t>) => (arena: t) => { arena.templates[accountId] = value };

  return resolve(log)(arena)(get)(set)(TemplateArena.resolve(pool)(log)(accountId))
}

export const idFor = (arena: t) => (tag: string) => {
  return uuid(`${arena.id}_${tag}`, uuid.URL);
}

export const empty = (id: string) => (user: User.Internal.t): t => {
  return {
      id: id
    , user: user
    , physical: { account: O.none, rules: O.none, transactions: O.none }
    , virtual: { account: O.none, rules: O.none, transactions: O.none }
    , integrations: O.none
    , notifications: O.none
    , templates: {}
  }
}

export const fromId = (pool: Pool) => (log : Logger) => (id: string) => (userId: string): TE.TaskEither<Exception.t, t> => {
  return pipe(
      UserFrontend.getById(pool)(log)(userId)
    , TE.map(empty(id))
  );
}

export * as Account from "./account-arena";
export * as Rule from "./rule-arena";
export * as Transaction from "./transaction-arena";
export * as Integrations from "./integration-arena";
export * as Notifications from "./notification-arena";
