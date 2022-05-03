import * as graphql from "graphql";
import * as Context from './context';
export declare const t: {
    type: graphql.GraphQLObjectType<any, any>;
    resolve: (source: any, args: any, context: Context.t) => {
        id: string;
        email: string;
        password: string;
        role: string;
    };
};
