import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";
import { ItemPublicTokenExchangeResponse } from "plaid";

import { AuthenticationFor } from "./util";

import { Source, Integration, Plaid } from "model";
import { IntegrationFrontend, SourceFrontend } from "storage";
import { Exception, Message, Plaid as PlaidHelper, Route } from "magic";

export const router = new Route.Router();

router
  .use(AuthenticationFor.user);

router
  .post("/create_link_token", (context) => {
    const user = context.response.locals.user;

    return pipe(
        PlaidHelper.createLinkToken(context.request.app.locals.plaidClient)(user.id)
      , TE.map((token) => { return { token: token }; })
      , Route.respondWith(context)(Plaid.Frontend.Response.CreateLinkToken.Json)
    );
  });

router
  .post("/exchange_public_token", (context) => {
    return pipe(
        TE.Do
      , TE.bind("request", () => Route.parseBody(context)(Plaid.Frontend.Request.ExchangePublicToken.Json))
      , TE.bind("publicToken", ({ request }) => PlaidHelper.exchangePublicToken(context.request.app.locals.plaidClient)(request.publicToken))
      , TE.chain(({ request, publicToken }) => build(context)(request)(publicToken))
      , Route.respondWithOk(context)
    );
  });

const build =
  (context: Route.Context) =>
  (request: Plaid.Frontend.Request.ExchangePublicToken.t) =>
  (publicToken: ItemPublicTokenExchangeResponse): TE.TaskEither<Exception.t, void> => {
  const requestId = context.response.locals.id;
  const user = context.response.locals.user;
  const pool = context.request.app.locals.db

  console.log(`[${requestId}] - building integration/sources`);

  const buildIntegration = (): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    console.log(`[${requestId}] - building integration "${request.institutionName}"`);
    const integration: Integration.Internal.t = {
        id: ""
      , userId: user.id
      , name: request.institutionName
      , credentials: { _type: "Plaid", itemId: publicToken.item_id, accessToken: publicToken.access_token }
    };

    return IntegrationFrontend.create(pool)(integration);
  }

  const buildSources = (integration: Integration.Internal.t): TE.TaskEither<Exception.t, void> => {
    console.log(`[${requestId}] - building sources "${request.accounts}"`);
    const sources: Source.Internal.t[] = A.map(({ id, name }: Plaid.Frontend.Request.ExchangePublicToken.Account) => {
      return <Source.Internal.t>{
          id: ""
        , userId: user.id
        , name: name
        , integrationId: O.some(integration.id)
        , metadata: O.some({ _type: "Plaid", accountId: id })
        , createdAt: O.none
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
