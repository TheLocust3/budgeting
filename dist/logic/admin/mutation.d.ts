import * as graphql from "graphql";
import * as Context from './context';
import * as Types from "../graphql/types";
export declare namespace CreatePlaidIntegration {
    type Args = {
        userId: string;
        itemId: string;
        accessToken: string;
        accounts: Types.PlaidAccount.t[];
        institutionName: string;
    };
    const Args: {
        userId: {
            type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
        };
        itemId: {
            type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
        };
        accessToken: {
            type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
        };
        accounts: {
            type: graphql.GraphQLList<graphql.GraphQLInputObjectType>;
        };
        institutionName: {
            type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
        };
    };
    export const t: {
        type: graphql.GraphQLScalarType<boolean, boolean>;
        args: {
            userId: {
                type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
            };
            itemId: {
                type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
            };
            accessToken: {
                type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
            };
            accounts: {
                type: graphql.GraphQLList<graphql.GraphQLInputObjectType>;
            };
            institutionName: {
                type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
            };
        };
        resolve: (source: any, { userId, itemId, accessToken, accounts, institutionName }: Args, context: Context.t) => Promise<boolean>;
    };
    export {};
}
declare const mutation: graphql.GraphQLObjectType<any, Context.t>;
export default mutation;
