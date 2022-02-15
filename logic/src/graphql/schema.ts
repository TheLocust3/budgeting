import Express from "express";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as UserResolver from './user-resolver';
import * as AccountResolver from './account-resolver';
import { passthroughResolver } from './util';

import { UserFrontend } from "storage";
import { Exception } from "magic";

// TODO: integrations/sources
const queryType = new graphql.GraphQLObjectType({
  name: 'Query',
  fields: {
      user: {
          type: UserResolver.t
        , resolve: passthroughResolver
      }
    , global: {
          type: AccountResolver.Global.t
        , resolve: passthroughResolver
      }
    , physical: {
          type: AccountResolver.Physical.t
        , resolve: passthroughResolver
      }
    , virtual: {
          type: AccountResolver.Virtual.t
        , resolve: passthroughResolver
      }
  }
});

const schema = new graphql.GraphQLSchema({ query: queryType });

export default schema;