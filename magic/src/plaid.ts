import {
    PlaidApi
  , TransactionsGetResponse
  , Transaction as PlaidTransaction
  , CountryCode
  , LinkTokenCreateRequest
  , LinkTokenCreateResponse
  , ItemPublicTokenExchangeResponse
  , Products
} from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";
import moment from "moment";

import { Exception } from "./index";

export const getTransactions =
  (plaidClient: PlaidApi) =>
  (accessToken: string, startDate: Date, endDate: Date): TE.TaskEither<Error, PlaidTransaction[]> => {

  const pull = (): TE.TaskEither<Error, TransactionsGetResponse> => {
    return TE.tryCatch(
        async () => {
          const response = await plaidClient.transactionsGet({
              access_token: accessToken
            , start_date: moment(startDate).format("YYYY-MM-DD")
            , end_date: moment(endDate).format("YYYY-MM-DD")
          });

          return response.data;
        }
      , E.toError
    );
  }

  return pipe(
      pull()
    , TE.map((response) => response.transactions)
  );
}

export const createLinkToken = (plaidClient: PlaidApi) => (userId: string): TE.TaskEither<Exception.t, string> => {
  const req: LinkTokenCreateRequest = {
    user: { client_user_id: userId },
    client_name: "Budgeting",
    products: [Products.Transactions],
    language: 'en',
    country_codes: [CountryCode.Us],
  };

  return pipe(
      TE.tryCatch(
          () => plaidClient.linkTokenCreate(req)
        , (_) => Exception.throwInternalError
      )
    , TE.map((response) => response.data.link_token)
  );
}

export const exchangePublicToken =
  (plaidClient: PlaidApi) =>
  (publicToken: string): TE.TaskEither<Exception.t, ItemPublicTokenExchangeResponse> => {
  return pipe(
      TE.tryCatch(
          () => plaidClient.itemPublicTokenExchange({ public_token: publicToken })
        , (_) => Exception.throwInternalError
      )
    , TE.map((response) => response.data)
  )
}
