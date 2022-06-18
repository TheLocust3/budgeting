import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";
import { ItemPublicTokenExchangeResponse } from "plaid";

import { UserResource } from "../../../user";
import * as Context from "../context";
import * as Types from "../types";
import { asList } from "../util";

import { Source, Integration, Plaid } from "../../../model";
import { IntegrationFrontend, SourceFrontend } from "../../../storage";
import { Exception, Message, Plaid as PlaidHelper, Route, Pipe } from "../../../magic";

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
      type: new graphql.GraphQLNonNull(Token)
    , resolve: resolve
  };
}

export namespace ExchangePublicToken {
  type Args = { publicToken: string; accounts: Types.PlaidAccount.t[]; institutionName: string; };
  const Args = {
      publicToken: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , accounts: { type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.PlaidAccount.t)) }
    , institutionName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { publicToken, accounts, institutionName }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        PlaidHelper.exchangePublicToken(context.plaidClient)(publicToken)
      , TE.chain((publicToken) =>
          UserResource.Integration.create(context.pool)(context.plaidClient)(context.arena)({ institutionName: institutionName, accounts: asList(accounts) })(publicToken)
        )
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}
