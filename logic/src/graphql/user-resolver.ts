import * as graphql from "graphql";

import { User } from "model";

const resolveUserField = (field: keyof User.Internal.t) => (source: any, args: any, request: Express.Request): string => {
  return request.user[field];
}

export const t = new graphql.GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: graphql.GraphQLString, resolve: resolveUserField("id") },
    email: { type: graphql.GraphQLString, resolve: resolveUserField("email") }
  }
});