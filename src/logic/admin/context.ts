import { Pool } from "pg";
import { PlaidApi } from "plaid";

export type t = {
  id: string;
  pool: Pool;
  plaidClient: PlaidApi;
}

export const empty = (request: any, response: any) => {
  return {
      id: response.locals.id
    , pool: request.app.locals.db
    , plaidClient: request.app.locals.plaidClient
  }
}
