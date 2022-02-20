import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";
import { ItemPublicTokenExchangeResponse } from "plaid";

import * as Context from "../context";
import * as Types from "../types";
import { toPromise } from "../util";

import { Source, Integration, Plaid } from "model";
import { IntegrationFrontend, SourceFrontend } from "storage";
import { Exception, Message, Plaid as PlaidHelper, Route } from "magic";

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
        PlaidHelper.createLinkToken(context.plaidClient)(context.user.id)
      , TE.map((token) => { return { token: token }; })
      , toPromise
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

  const resolve = (source: any, { publicToken, accounts, institutionName }: Args, context: Context.t): Promise<{}> => {
    return pipe(
        PlaidHelper.exchangePublicToken(context.plaidClient)(publicToken)
      , TE.chain(({ request, publicToken }) => build(context)(request)(publicToken))
      , TE.map(() => true)
      , toPromise
    );
  }

  export const t = {
      type: Types.Void.t
    , args: Args
    , resolve: resolve
  };
}

const build =
  (context: Context.t) =>
  (request: Plaid.External.Request.ExchangePublicToken.t) =>
  (publicToken: ItemPublicTokenExchangeResponse): TE.TaskEither<Exception.t, void> => {
  const requestId = context.id;
  const user = context.user;
  const pool = context.pool;

  console.log(`[${requestId}] - building integration/sources`);

  const buildIntegration = (): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    console.log(`[${requestId}] - building integration "${request.institutionName}"`);
    const integration: Integration.Frontend.Create.t = {
        userId: user.id
      , name: request.institutionName
      , credentials: { _type: "Plaid", itemId: publicToken.item_id, accessToken: publicToken.access_token }
    };

    return IntegrationFrontend.create(pool)(integration);
  }

  const buildSources = (integration: Integration.Internal.t): TE.TaskEither<Exception.t, void> => {
    console.log(`[${requestId}] - building sources "${request.accounts}"`);
    const sources: Source.Frontend.Create.t[] = A.map(({ id, name }: Plaid.External.Request.ExchangePublicToken.Account) => {
      return <Source.Frontend.Create.t>{
          userId: user.id
        , name: name
        , integrationId: O.some(integration.id)
        , metadata: O.some({ _type: "Plaid", accountId: id })
      };
    })(request.accounts);

    return pipe(
        sources
      , A.map(SourceFrontend.create(pool))
      , A.sequence(TE.ApplicativeSeq)
      , TE.map(() => {
          console.log(`[${requestId}] - integration/sources built`);
        })
    );
  }

  return pipe(
      buildIntegration()
    , TE.chain(buildSources)
  );
}
