import { Pool } from "pg";
import { PlaidApi } from "plaid";
import * as T from "fp-ts/Task";
export declare const run: (pool: Pool) => (plaidClient: PlaidApi) => (id: string) => T.Task<boolean>;
