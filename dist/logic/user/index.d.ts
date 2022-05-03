export * as UserArena from "./arena";
export declare namespace UserResource {
    const create: (pool: import("pg").Pool) => (user: {
        email: string;
        password: string;
        role: string;
    }) => import("fp-ts/lib/TaskEither").TaskEither<import("../../magic/exception").t, {
        id: string;
        email: string;
        password: string;
        role: string;
    }>;
    namespace Bucket {
        const create: (arena: import("./arena").t) => (name: string) => import("fp-ts/lib/TaskEither").TaskEither<import("../../magic/exception").t, {
            id: string;
            parentId: import("fp-ts/lib/Option").Option<string>;
            userId: string;
            name: string;
        }>;
    }
    namespace Rule {
        const splitTransaction: (arena: import("./arena").t) => (transactionId: string, splits: {
            bucket: string;
            value: number;
        }[], remainder: string) => import("fp-ts/lib/TaskEither").TaskEither<import("../../magic/exception").t, {
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
        }>;
        const remove: (arena: import("./arena").t) => (ruleId: string) => import("fp-ts/lib/TaskEither").TaskEither<import("../../magic/exception").t, void>;
    }
    namespace Integration {
        const create: (pool: import("pg").Pool) => (requestId: string) => (arena: import("./arena").t) => (request: {
            institutionName: string;
            accounts: {
                id: string;
                name: string;
            }[];
        }) => (publicToken: {
            item_id: string;
            access_token: string;
        }) => import("fp-ts/lib/TaskEither").TaskEither<import("../../magic/exception").t, void>;
        const remove: (pool: import("pg").Pool) => (arena: import("./arena").t) => (integrationId: string) => import("fp-ts/lib/TaskEither").TaskEither<import("../../magic/exception").t, void>;
    }
}
