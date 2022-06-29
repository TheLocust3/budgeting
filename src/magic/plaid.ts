import {
    PlaidApi
  , TransactionsGetResponse
  , Transaction as PlaidTransaction
  , AccountBase
  , CountryCode
  , LinkTokenCreateRequest
  , LinkTokenCreateResponse
  , ItemPublicTokenExchangeResponse
  , Products
  , Configuration
  , PlaidEnvironments
} from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";
import moment from "moment";

import { Exception } from "./index";

const environment = () => {
  switch (process.env.ENVIRONMENT) {
    case "test":
    case "TEST":
      return PlaidEnvironments.sandbox;
    default:
      return PlaidEnvironments.development;
  }
}

export const buildClient = () => {
  const plaidConfig = new Configuration({
    basePath: environment(),
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET
      },
    },
  });

  return new PlaidApi(plaidConfig);
}

const pull =
  (plaidClient: PlaidApi) =>
  (accessToken: string, startDate: Date, endDate: Date): TE.TaskEither<Error, TransactionsGetResponse> => {
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

export const getTransactions =
  (plaidClient: PlaidApi) =>
  (accessToken: string, startDate: Date, endDate: Date): TE.TaskEither<Error, PlaidTransaction[]> => {
  return pipe(
      pull(plaidClient)(accessToken, startDate, endDate)
    , TE.map((response) => response.transactions)
  );
}

export const getAccounts =
  (plaidClient: PlaidApi) =>
  (accessToken: string, startDate: Date, endDate: Date): TE.TaskEither<Error, AccountBase[]> => {
  return pipe(
      pull(plaidClient)(accessToken, startDate, endDate)
    , TE.map((response) => response.accounts)
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
        , Exception.throwInternalError
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
        , Exception.throwInternalError
      )
    , TE.map((response) => response.data)
  )
}
