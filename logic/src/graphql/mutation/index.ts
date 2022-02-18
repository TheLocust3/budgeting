import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as PlaidMutation from "./plaid-mutation";

import { Exception } from "magic";

namespace CreateBucket {
  export const t = {
      type: graphql.GraphQLString
    , args: {
        name: { type: graphql.GraphQLString }
      }
  };
}

namespace CreateSplitByValue {
  const Value = new graphql.GraphQLInputObjectType({
      name: "Value"
    , fields: {
          account: { type: graphql.GraphQLString }
        , value: { type: graphql.GraphQLFloat }
      }
  });

  export const t = {
      type: graphql.GraphQLString
    , args: {
          splits: { type: new graphql.GraphQLList(Value) }
        , remainder: { type: graphql.GraphQLString }
      }
  };
}

namespace DeleteRule {
  export const t = {
      type: graphql.GraphQLString
    , args: {
        id: { type: graphql.GraphQLString }
      }
  };
}

export const mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation'
  , fields: {
        createBucket: CreateBucket.t
      , createSplitByValue: CreateSplitByValue.t
      , deleteRule: DeleteRule.t
      , createLinkToken: PlaidMutation.CreateLinkToken.t
      , createPlaidIntegration: PlaidMutation.ExchangePublicToken.t
    }
});

export default mutationType;
