import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as Context from "../context";
import * as Types from "../types";

import { Exception } from "magic";

export namespace CreateLinkToken {
  const token = new graphql.GraphQLObjectType({
      name: "CreateLinkToken"
    , fields: {
        token: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  });

  export const t = {
    type: token
  };
}

export namespace ExchangePublicToken {
  export const PlaidAccount = new graphql.GraphQLInputObjectType({
      name: "PlaidAccount"
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  })

  export const t = {
      type: Types.Void.t
    , args: {
          publicToken: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , accounts: { type: new graphql.GraphQLList(PlaidAccount) }
        , institutionName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  };
}

export namespace InsertPlaidIntegration {
  export const t = {
      type: Types.Void.t
    , args: {
          itemId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , accessToken: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , accounts: { type: new graphql.GraphQLList(ExchangePublicToken.PlaidAccount) }
        , institutionName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  };
}
