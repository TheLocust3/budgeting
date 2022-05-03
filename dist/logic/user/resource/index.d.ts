import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { UserArena } from "../index";
import { User, Account, Rule } from "../../../model";
import { Exception } from "../../../magic";
export declare const createUser: (pool: Pool) => (user: User.Frontend.Create.t) => TE.TaskEither<Exception.t, User.Internal.t>;
export declare const createBucket: (arena: UserArena.t) => (name: string) => TE.TaskEither<Exception.t, Account.Internal.t>;
export declare const splitTransaction: (arena: UserArena.t) => (transactionId: string, splits: {
    bucket: string;
    value: number;
}[], remainder: string) => TE.TaskEither<Exception.t, Rule.Internal.t>;
export declare const removeRule: (arena: UserArena.t) => (ruleId: string) => TE.TaskEither<Exception.t, void>;
export declare const removeIntegration: (pool: Pool) => (arena: UserArena.t) => (integrationId: string) => TE.TaskEither<Exception.t, void>;
export declare const createIntegration: (pool: Pool) => (requestId: string) => (arena: UserArena.t) => (request: {
    institutionName: string;
    accounts: {
        id: string;
        name: string;
    }[];
}) => (publicToken: {
    item_id: string;
    access_token: string;
}) => TE.TaskEither<Exception.t, void>;
