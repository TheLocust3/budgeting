import * as graphql from "graphql";
export declare namespace User {
    const t: graphql.GraphQLObjectType<any, any>;
}
export declare namespace Integration {
    type t = {
        id: string;
        name: string;
        sources: {
            id: string;
            name: string;
        }[];
    };
    const t: graphql.GraphQLObjectType<any, any>;
}
export declare namespace Rule {
    const t: graphql.GraphQLObjectType<any, any>;
}
export declare namespace Transaction {
    const t: graphql.GraphQLObjectType<any, any>;
}
export declare namespace Account {
    const t: graphql.GraphQLObjectType<any, any>;
}
export declare namespace Void {
    const t: graphql.GraphQLScalarType<boolean, boolean>;
}
export declare namespace PlaidAccount {
    type t = {
        id: string;
        name: string;
    };
    const t: graphql.GraphQLInputObjectType;
}
