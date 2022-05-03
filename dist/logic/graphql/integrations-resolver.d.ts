import * as graphql from "graphql";
import * as Context from './context';
import * as Types from './types';
export declare const t: {
    type: graphql.GraphQLList<graphql.GraphQLObjectType<any, any>>;
    resolve: (source: any, args: any, context: Context.t) => Promise<Types.Integration.t[]>;
};
