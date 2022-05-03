import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { Account, Materialize } from "../../model";
import { Exception } from "../../magic";
export declare const execute: (id: string) => (pool: Pool) => (account: Account.Internal.Rich) => TE.TaskEither<Exception.t, Materialize.Internal.t>;
