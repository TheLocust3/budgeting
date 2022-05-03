import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { Source, Integration, Transaction } from "../../model";
export declare type Context = {
    source: Source.Internal.t;
    integration: Integration.Internal.t;
};
export declare type PullerException = "NoWork" | "Exception";
export declare const withIntegration: (pool: Pool) => (source: Source.Internal.t) => TE.TaskEither<PullerException, Context>;
export declare const pushTransactions: (pool: Pool) => (id: string) => (transactions: Transaction.Internal.t[]) => TE.TaskEither<PullerException, void>;
