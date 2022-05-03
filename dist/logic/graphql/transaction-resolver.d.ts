import * as O from "fp-ts/Option";
import * as graphql from "graphql";
import * as Context from "./context";
export declare namespace Transactions {
    namespace Physical {
        const t: {
            type: graphql.GraphQLList<graphql.GraphQLObjectType<any, any>>;
            resolve: (source: {
                id: string;
                parentId: O.Option<string>;
                userId: string;
                name: string;
            }, args: any, context: Context.t) => Promise<{
                id: string;
                sourceId: string;
                userId: string;
                amount: number;
                merchantName: string;
                description: string;
                authorizedAt: Date;
                capturedAt: O.Option<Date>;
                metadata: object;
                custom: {
                    [x: string]: string[];
                };
            }[]>;
        };
    }
    namespace Virtual {
        const t: {
            type: graphql.GraphQLList<graphql.GraphQLObjectType<any, any>>;
            resolve: (source: {
                id: string;
                parentId: O.Option<string>;
                userId: string;
                name: string;
            }, args: any, context: Context.t) => Promise<{
                id: string;
                sourceId: string;
                userId: string;
                amount: number;
                merchantName: string;
                description: string;
                authorizedAt: Date;
                capturedAt: O.Option<Date>;
                metadata: object;
                custom: {
                    [x: string]: string[];
                };
            }[]>;
        };
    }
}
export declare namespace Untagged {
    const t: {
        type: graphql.GraphQLList<graphql.GraphQLObjectType<any, any>>;
        resolve: (source: any, args: any, context: Context.t) => Promise<{
            id: string;
            sourceId: string;
            userId: string;
            amount: number;
            merchantName: string;
            description: string;
            authorizedAt: Date;
            capturedAt: O.Option<Date>;
            metadata: object;
            custom: {
                [x: string]: string[];
            };
        }[]>;
    };
}
export declare namespace Conflicts {
    const t: {
        type: graphql.GraphQLList<graphql.GraphQLObjectType<any, any>>;
        resolve: (source: any, args: any, context: Context.t) => Promise<{
            element: {
                id: string;
                sourceId: string;
                userId: string;
                amount: number;
                merchantName: string;
                description: string;
                authorizedAt: Date;
                capturedAt: O.Option<Date>;
                metadata: object;
                custom: {
                    [x: string]: string[];
                };
            };
            rules: ({
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
            })[];
        }[]>;
    };
}
