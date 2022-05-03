import { Pool } from "pg";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { Account } from "../../model";
import { Exception } from "../../magic";
export declare namespace AccountFrontend {
    const all: (pool: Pool) => (userId: string) => TE.TaskEither<Exception.t, Account.Internal.t[]>;
    const getById: (pool: Pool) => (id: string) => TE.TaskEither<Exception.t, Account.Internal.t>;
    const getByIdAndUserId: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Exception.t, Account.Internal.t>;
    const withRules: (pool: Pool) => <T>(account: {
        id: string;
        parentId: O.Option<string>;
        userId: string;
        name: string;
    } & T) => TE.TaskEither<Exception.t, {
        id: string;
        parentId: O.Option<string>;
        userId: string;
        name: string;
    } & T & {
        rules: {
            id: string;
            accountId: string;
            userId: string;
            rule: {
                _type: "SplitByPercent";
                where: import("../../model/rule").Internal.Clause.t;
                splits: {
                    _type: "Percent";
                    account: string;
                    percent: number;
                }[];
            } | {
                _type: "SplitByValue";
                where: import("../../model/rule").Internal.Clause.t;
                splits: {
                    _type: "Value";
                    account: string;
                    value: number;
                }[];
                remainder: string;
            } | {
                _type: "Attach";
                where: import("../../model/rule").Internal.Clause.t;
                field: string;
                value: string;
            } | {
                _type: "Include";
                where: import("../../model/rule").Internal.Clause.t;
            };
        }[];
    }>;
    const withChildren: (pool: Pool) => <T>(account: {
        id: string;
        parentId: O.Option<string>;
        userId: string;
        name: string;
    } & T) => TE.TaskEither<Exception.t, {
        id: string;
        parentId: O.Option<string>;
        userId: string;
        name: string;
    } & T & {
        children: string[];
    }>;
    const create: (pool: Pool) => (account: Account.Frontend.Create.t) => TE.TaskEither<Exception.t, Account.Internal.t>;
    const deleteById: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Exception.t, void>;
}
export default AccountFrontend;
