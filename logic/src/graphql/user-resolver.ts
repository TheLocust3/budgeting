import * as graphql from "graphql";

import * as Context from './context';

import { User } from "model";

export const t = {
    type: new graphql.GraphQLObjectType({
        name: 'User'
      , fields: {
            id: { type: graphql.GraphQLString }
          , email: { type: graphql.GraphQLString }
        }
    })
  , resolve: (source: any, args: any, context: Context.t) => context.user
}