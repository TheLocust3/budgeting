import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";
import { ItemPublicTokenExchangeResponse } from "plaid";

import { AuthenticationFor } from "./util";

import { Integration, Plaid } from "model";
import { IntegrationFrontend } from "storage";
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

  console.log(`[${requestId}] - building integration`);

  const sources: Integration.Internal.Plaid.Source[] =
    A.map(({ id, name }: Plaid.Frontend.Request.ExchangePublicToken.Account) => {
      return <Integration.Internal.Plaid.Source>{
          name: name
        , forAccountId: id
        , createdAt: new Date()
      };
    })(request.accounts);

  const integration: Integration.Internal.Plaid.t = {
      _type: "Plaid"
    , name: request.institutionName
    , credentials: { itemId: publicToken.item_id, accessToken: publicToken.access_token }
    , sources: sources
  }

  return pipe(
      IntegrationFrontend.create(user.email)(integration)
    , TE.map(() => {})
  );
}
