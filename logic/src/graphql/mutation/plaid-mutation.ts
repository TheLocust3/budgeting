import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { Exception } from "magic";

export namespace CreateLinkToken {
  export const t = { type: graphql.GraphQLString };
}

export namespace ExchangePublicToken {
  const PlaidAccount = new graphql.GraphQLInputObjectType({
      name: "PlaidAccount"
    , fields: {
          id: { type: graphql.GraphQLString }
        , name: { type: graphql.GraphQLString }
      }
  })

  export const t = {
      type: graphql.GraphQLString
    , args: {
          publicToken: { type: graphql.GraphQLString }
        , accounts: { type: new graphql.GraphQLList(PlaidAccount) }
        , institutionName: { type: graphql.GraphQLString }
      }
  };
}
