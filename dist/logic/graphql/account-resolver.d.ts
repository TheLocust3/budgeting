import * as O from "fp-ts/Option";
import * as graphql from "graphql";
import * as Context from "./context";
export declare namespace Accounts {
    const t: {
        type: graphql.GraphQLList<graphql.GraphQLObjectType<{
            id: string;
            parentId: O.Option<string>;
            userId: string;
            name: string;
        }, Context.t>>;
        resolve: (source: any, args: any, context: Context.t) => Promise<{
            id: string;
            parentId: O.Option<string>;
            userId: string;
            name: string;
        }[]>;
    };
}
export declare namespace Buckets {
    const t: {
        type: graphql.GraphQLList<graphql.GraphQLObjectType<{
            id: string;
            parentId: O.Option<string>;
            userId: string;
            name: string;
        }, Context.t>>;
        resolve: (source: any, args: any, context: Context.t) => Promise<{
            id: string;
            parentId: O.Option<string>;
            userId: string;
            name: string;
        }[]>;
    };
}
