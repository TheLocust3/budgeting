import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";
import { ItemPublicTokenExchangeResponse } from "plaid";

import { UserResource } from "../../user";
import * as Context from "../context";
import * as Types from "../types";
import { asList } from "../util";

import { Source, Integration, Plaid } from "model";
import { IntegrationFrontend, SourceFrontend } from "storage";
import { Exception, Message, Plaid as PlaidHelper, Route, Pipe } from "magic";

export namespace CreateLinkToken {
  type Token = { token: string; };
  const Token = new graphql.GraphQLObjectType({
      name: "CreateLinkToken"
    , fields: {
        token: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  });

  const resolve = (source: any, args: any, context: Context.t): Promise<Token> => {
    return pipe(
        PlaidHelper.createLinkToken(context.plaidClient)(context.arena.user.id)
      , TE.map((token) => { return { token: token }; })
      , Pipe.toPromise
    );
  }

  export const t = {
      type: Token
    , resolve: resolve
  };
}

export namespace ExchangePublicToken {
  export type PlaidAccount = { id: string; name: string; };
  export const PlaidAccount = new graphql.GraphQLInputObjectType({
      name: "PlaidAccount"
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  });

  type Args = { publicToken: string; accounts: PlaidAccount[]; institutionName: string; };
  const Args = {
      publicToken: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , accounts: { type: new graphql.GraphQLList(PlaidAccount) }
    , institutionName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { publicToken, accounts, institutionName }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        PlaidHelper.exchangePublicToken(context.plaidClient)(publicToken)
      , TE.chain((publicToken) =>
          UserResource.Integration.create(context.pool)(context.id)(context.arena)({ institutionName: institutionName, accounts: asList(accounts) })(publicToken)
        )
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: Types.Void.t
    , args: Args
    , resolve: resolve
  };
}

export namespace CreatePlaidIntegration {
  type Args = { itemId: string; accessToken: string; accounts: ExchangePublicToken.PlaidAccount[]; institutionName: string; };
  const Args = {
      itemId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , accessToken: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , accounts: { type: new graphql.GraphQLList(ExchangePublicToken.PlaidAccount) }
    , institutionName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { itemId, accessToken, accounts, institutionName }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserResource.Integration.create(context.pool)(context.id)(context.arena)({ institutionName: institutionName, accounts: asList(accounts) })({ item_id: itemId, access_token: accessToken })
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: Types.Void.t
    , args: Args
    , resolve: resolve
  };
}
