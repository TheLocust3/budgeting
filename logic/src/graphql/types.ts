import * as graphql from "graphql";
import { GraphQLJSONObject } from 'graphql-type-json';

export namespace User {
  export const t = new graphql.GraphQLObjectType({
      name: 'User'
    , fields: {
          id: { type: graphql.GraphQLString }
        , email: { type: graphql.GraphQLString }
      }
  })
}

export namespace Rule {
  export const t = new graphql.GraphQLObjectType({
      name: 'Rule'
    , fields: {
          id: { type: graphql.GraphQLString }
        , rule: { type: GraphQLJSONObject }
      }
  });
}

export namespace Transaction {
  export const t = new graphql.GraphQLObjectType({
      name: 'Transaction'
    , fields: {
          id: { type: graphql.GraphQLString }
        , sourceId: { type: graphql.GraphQLString }
        , amount: { type: graphql.GraphQLFloat }
        , merchantName: { type: graphql.GraphQLString }
        , description: { type: graphql.GraphQLString }
        , authorizedAt: { type: graphql.GraphQLInt }
        , capturedAt: { type: graphql.GraphQLInt }
      }
  });
}

export namespace Account {
  export const t = new graphql.GraphQLObjectType({
      name: 'Transaction'
    , fields: {
          id: { type: graphql.GraphQLString }
        , name: { type: graphql.GraphQLString }
      }
  });
}

export namespace Void {
  export const t = graphql.GraphQLBoolean
}
