import * as graphql from "graphql";
import * as Context from "../context";
import * as Types from "../types";
export declare namespace CreateLinkToken {
    type Token = {
        token: string;
    };
    const Token: graphql.GraphQLObjectType<any, any>;
    export const t: {
        type: graphql.GraphQLObjectType<any, any>;
        resolve: (source: any, args: any, context: Context.t) => Promise<Token>;
    };
    export {};
}
export declare namespace ExchangePublicToken {
    type Args = {
        publicToken: string;
        accounts: Types.PlaidAccount.t[];
        institutionName: string;
    };
    const Args: {
        publicToken: {
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
            publicToken: {
                type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
            };
            accounts: {
                type: graphql.GraphQLList<graphql.GraphQLInputObjectType>;
            };
            institutionName: {
                type: graphql.GraphQLNonNull<graphql.GraphQLScalarType<string, string>>;
            };
        };
        resolve: (source: any, { publicToken, accounts, institutionName }: Args, context: Context.t) => Promise<boolean>;
    };
    export {};
}
