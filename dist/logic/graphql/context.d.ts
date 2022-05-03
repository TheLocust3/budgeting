import { Pool } from "pg";
import { PlaidApi } from "plaid";
import { UserArena } from "../user";
export declare type t = {
    id: string;
    pool: Pool;
    plaidClient: PlaidApi;
    arena: UserArena.t;
};
export declare const empty: (request: any, response: any) => {
    id: any;
    pool: any;
    plaidClient: any;
    arena: UserArena.t;
};
