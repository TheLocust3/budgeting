import { Pool } from "pg";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as AccountArena from "./account-arena";
import * as RuleArena from "./rule-arena";
import * as TransactionArena from "./transaction-arena";
import * as IntegrationArena from "./integration-arena";
import { User } from "../../../model";
import { Exception } from "../../../magic";
declare type Resolvable<T> = O.Option<Promise<T>>;
export declare namespace Layer {
    type t = {
        account: Resolvable<AccountArena.t>;
        rules: Resolvable<RuleArena.t>;
        transactions: Resolvable<TransactionArena.t>;
    };
}
export declare type t = {
    user: User.Internal.t;
    physical: Layer.t;
    virtual: Layer.t;
    integrations: Resolvable<IntegrationArena.t>;
};
export declare const physical: (arena: t) => TE.TaskEither<Exception.t, AccountArena.t>;
export declare const materializePhysical: (arena: t) => TE.TaskEither<Exception.t, TransactionArena.t>;
export declare const virtual: (arena: t) => TE.TaskEither<Exception.t, AccountArena.t>;
export declare const virtualRules: (arena: t) => TE.TaskEither<Exception.t, RuleArena.t>;
export declare const materializeVirtual: (arena: t) => TE.TaskEither<Exception.t, TransactionArena.t>;
export declare const integrations: (pool: Pool) => (arena: t) => TE.TaskEither<Exception.t, IntegrationArena.t>;
export declare const empty: (user: User.Internal.t) => t;
export declare const fromId: (pool: Pool) => (userId: string) => TE.TaskEither<Exception.t, t>;
export * as Account from "./account-arena";
export * as Rule from "./rule-arena";
export * as Transaction from "./transaction-arena";
export * as Integrations from "./integration-arena";
