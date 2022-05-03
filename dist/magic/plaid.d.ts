import { PlaidApi, Transaction as PlaidTransaction, AccountBase, ItemPublicTokenExchangeResponse } from "plaid";
import * as TE from "fp-ts/TaskEither";
import { Exception } from "./index";
export declare const getTransactions: (plaidClient: PlaidApi) => (accessToken: string, startDate: Date, endDate: Date) => TE.TaskEither<Error, PlaidTransaction[]>;
export declare const getAccounts: (plaidClient: PlaidApi) => (accessToken: string, startDate: Date, endDate: Date) => TE.TaskEither<Error, AccountBase[]>;
export declare const createLinkToken: (plaidClient: PlaidApi) => (userId: string) => TE.TaskEither<Exception.t, string>;
export declare const exchangePublicToken: (plaidClient: PlaidApi) => (publicToken: string) => TE.TaskEither<Exception.t, ItemPublicTokenExchangeResponse>;
