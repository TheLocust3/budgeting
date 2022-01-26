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

import { Source } from "model";
import { Exception, Message } from "magic";

export const router = new Router();

namespace Request {
  export namespace ExchangePublicToken {
    const t = iot.type({
      publicToken: iot.string
    });
    type t = iot.TypeOf<typeof t>

    export const from = (request: any): E.Either<Exception.t, t> => {
      return pipe(
          request
        , t.decode
        , E.mapLeft((_) => Exception.throwMalformedJson)
      );
    };
  }
}

router
  // TODO: JK
  // .use(AuthenticationFor.user)
  .post("/create_link_token", async (ctx, next) => {
    const req: LinkTokenCreateRequest = {
      user: { client_user_id: "test" }, // TODO: JK
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
      , TE.match(
            Message.respondWithError(ctx)
          , (response: LinkTokenCreateResponse) => {
              ctx.body = { token: response.data.link_token };
            }
        )
    )();
  })
  .post("/exchange_public_token", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Request.ExchangePublicToken.from
      , TE.fromEither
      , TE.chain((publicToken) => {
          return TE.tryCatch(
                () => <Promise<ItemPublicTokenExchangeResponse>>ctx.plaidClient.itemPublicTokenExchange({ publicToken })
              , (e) => {
                  console.log(e)
                  return Exception.throwInternalError
                }
          );
        })
      , TE.match(
            Message.respondWithError(ctx)
          , (response) => {
              console.log(response);
              ctx.body = Message.ok;
            }
        )
    )();
  });
