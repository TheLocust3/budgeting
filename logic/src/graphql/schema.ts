import Express from "express";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as UserResolver from './user-resolver';
import { passthroughResolver } from './util';

import { UserFrontend } from "storage";
import { Exception } from "magic";

const accountType = new graphql.GraphQLObjectType({
  name: 'Account',
  fields: {
    id: { type: graphql.GraphQLString },
    name: { type: graphql.GraphQLString }
  }
});

// TODO: integrations/sources
const queryType = new graphql.GraphQLObjectType({
  name: 'Query',
  fields: {
      user: {
          type: UserResolver.t
        , resolve: passthroughResolver
      }
    , physical: {
          type: accountType
        , resolve: passthroughResolver
      }
    , virtual: {
          type: accountType
        , resolve: passthroughResolver
      }
  }
});

const schema = new graphql.GraphQLSchema({ query: queryType });

export default schema;