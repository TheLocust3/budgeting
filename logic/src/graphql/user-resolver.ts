import * as graphql from "graphql";

import { User } from "model";

type Field = "id" | "email" | "password";
const resolveUserField = (field: Field) => (source: any, args: any, request: Express.Request): string => {
  return request.context.user[field];
}

export const t = new graphql.GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: graphql.GraphQLString, resolve: resolveUserField("id") },
    email: { type: graphql.GraphQLString, resolve: resolveUserField("email") }
  }
});