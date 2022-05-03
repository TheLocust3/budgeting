import { Pool } from "pg";
import { PlaidApi } from "plaid";
export declare const tick: (pool: Pool) => (plaidClient: PlaidApi) => void;
