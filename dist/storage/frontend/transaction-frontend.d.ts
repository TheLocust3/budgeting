import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { Transaction } from "../../model";
import { Exception } from "../../magic";
export declare namespace TransactionFrontend {
    const all: (pool: Pool) => (userId: string) => TE.TaskEither<Exception.t, Transaction.Internal.t[]>;
    const getById: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Exception.t, Transaction.Internal.t>;
    const create: (pool: Pool) => (transaction: Transaction.Frontend.Create.t) => TE.TaskEither<Exception.t, Transaction.Internal.t>;
    const deleteById: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Exception.t, void>;
}
export default TransactionFrontend;
