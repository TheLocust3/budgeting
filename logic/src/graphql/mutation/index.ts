import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as Context from "../context";
import * as Types from "../types";
import * as PlaidMutation from "./plaid-mutation";

import { Exception } from "magic";

namespace CreateBucket {
  const JustBucket = new graphql.GraphQLObjectType({
      name: 'JustBucket'
    , fields: {
          id: { type: graphql.GraphQLString }
        , name: { type: graphql.GraphQLString }
      }
  })

  export const t = {
      type: JustBucket
    , args: {
        name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  };
}

namespace CreateSplitByValue {
  const Value = new graphql.GraphQLInputObjectType({
      name: "Value"
    , fields: {
          bucket: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , value: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
      }
  });

  export const t = {
      type: Types.Rule.t
    , args: {
          splits: { type: new graphql.GraphQLList(Value) }
        , remainder: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  };
}

namespace DeleteRule {
  export const t = {
      type: Types.Deleted.t
    , args: {
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
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
      , exchangePublicToken: PlaidMutation.ExchangePublicToken.t
      , insertPlaidIntegration: PlaidMutation.InsertPlaidIntegration.t
    }
});

export default mutationType;
