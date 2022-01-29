import { Pool } from "pg";
import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";
import { ItemPublicTokenExchangeResponse } from "plaid";

import SourceFrontend from "../frontend/source-frontend";
import IntegrationFrontend from "../frontend/integration-frontend";
import { AuthenticationFor } from "./util";

import { Source, Integration, Plaid } from "model";
import { Exception, Message, Plaid as PlaidHelper } from "magic";

export const router = new Router();

router
  .use(AuthenticationFor.user)
  .post("/create_link_token", async (ctx, next) => {
    const user = ctx.state.user;

    await pipe(
        PlaidHelper.createLinkToken(ctx.plaidClient)(user.id)
      , TE.map((token) => {
          return Plaid.Frontend.Response.CreateLinkToken.Json.to({ token: token });
        })
      , TE.match(
            Message.respondWithError(ctx)
          , (response) => {
              ctx.body = response;
            }
        )
    )();
  })
  .post("/exchange_public_token", async (ctx, next) => {
    const user = ctx.state.user;

    await pipe(
        TE.Do
      , TE.bind("request", () => pipe(ctx.request.body, Plaid.Frontend.Request.ExchangePublicToken.Json.from, TE.fromEither))
      , TE.bind("publicToken", ({ request }) => PlaidHelper.exchangePublicToken(ctx.plaidClient)(request.publicToken))
      , TE.chain(({ request, publicToken }) => build(ctx.pool)(user.id)(request)(publicToken))
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  });

const build =
  (pool: Pool) =>
  (userId: string) =>
  (request: Plaid.Frontend.Request.ExchangePublicToken.t) =>
  (publicToken: ItemPublicTokenExchangeResponse): TE.TaskEither<Exception.t, void> => {
  const buildIntegration = (): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    const integration: Integration.Internal.t = {
        id: ""
      , userId: userId
      , name: request.institutionName
      , credentials: { _type: "Plaid", itemId: publicToken.item_id, accessToken: publicToken.accessToken }
    };

    return IntegrationFrontend.create(pool)(integration);
  }

  const buildSources = (integration: Integration.Internal.t): TE.TaskEither<Exception.t, void> => {
    const sources: Source.Internal.t[] = A.map(({ id, name }: Plaid.Frontend.Request.ExchangePublicToken.Account) => {
      return <Source.Internal.t>{
          id: ""
        , userId: userId
        , name: name
        , integrationId: O.some(integration.id)
        , metadata: O.some({ _type: "Plaid", accountId: id })
        , createdAt: O.none
      };
    })(publicToken.accounts);

    return pipe(
        sources
      , A.map(SourceFrontend.create(pool))
      , A.sequence(TE.ApplicativeSeq)
      , TE.map(() => {})
    );
  }

  return pipe(
      buildIntegration()
    , TE.chain(buildSources)
  );
}
