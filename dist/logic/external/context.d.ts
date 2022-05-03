import { Pool } from "pg";
export declare type t = {
    id: string;
    pool: Pool;
};
export declare const empty: (request: any, response: any) => {
    id: any;
    pool: any;
};
