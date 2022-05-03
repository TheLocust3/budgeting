import * as graphql from "graphql";
import * as Context from "./context";
import { Rule } from "../../model";
export declare namespace Rules {
    namespace Virtual {
        const t: {
            type: graphql.GraphQLList<graphql.GraphQLObjectType<any, any>>;
            resolve: (source: any, args: any, context: Context.t) => Promise<{
                id: string;
                accountId: string;
                userId: string;
                rule: {
                    _type: "SplitByPercent";
                    where: Rule.Internal.Clause.t;
                    splits: {
                        _type: "Percent";
                        account: string;
                        percent: number;
                    }[];
                } | {
                    _type: "SplitByValue";
                    where: Rule.Internal.Clause.t;
                    splits: {
                        _type: "Value";
                        account: string;
                        value: number;
                    }[];
                    remainder: string;
                } | {
                    _type: "Attach";
                    where: Rule.Internal.Clause.t;
                    field: string;
                    value: string;
                } | {
                    _type: "Include";
                    where: Rule.Internal.Clause.t;
                };
            }[]>;
        };
    }
}
