import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";
import { CountryCode, LinkTokenCreateRequest, LinkTokenCreateResponse, ItemPublicTokenExchangeResponse, Products } from "plaid";

import SourceFrontend from "../frontend/source-frontend";
import { AuthenticationFor } from "./util";

import { Source, Plaid } from "model";
import { Exception, Message } from "magic";

export const router = new Router();

router
  .use(AuthenticationFor.user)
  .post("/create_link_token", async (ctx, next) => {
    const user = ctx.state.user;

    const req: LinkTokenCreateRequest = {
      user: { client_user_id: user.id },
      client_name: "Budgeting",
      products: [Products.Transactions],
      language: 'en',
      country_codes: [CountryCode.Us],
    };

    await pipe(
        TE.tryCatch(
            () => <Promise<LinkTokenCreateResponse>>ctx.plaidClient.linkTokenCreate(req)
          , E.toError
        )
      , TE.mapLeft(e => {
        console.log(e)
        return e
      })
      , TE.mapLeft((_) => Exception.throwInternalError)
      , TE.map((response: LinkTokenCreateResponse) => {
          return Plaid.Frontend.Response.CreateLinkToken.Json.to({ token: response.data.link_token });
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
    await pipe(
        ctx.request.body
      , Plaid.Frontend.Request.ExchangePublicToken.Json.from
      , TE.fromEither
      , TE.chain(({ publicToken }) => {
          return TE.tryCatch(
                () => <Promise<ItemPublicTokenExchangeResponse>>ctx.plaidClient.itemPublicTokenExchange({ public_token: publicToken })
              , (e) => {
                  console.log(e)
                  return Exception.throwInternalError
                }
          );
        })
      , TE.match(
            Message.respondWithError(ctx)
          , (response) => {
              /*
                data: {
                  access_token: ???,
                  item_id: ???,
                  request_id: ???
                }
              */
              ctx.body = Message.ok;
            }
        )
    )();
  });
