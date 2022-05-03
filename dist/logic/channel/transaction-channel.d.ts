import * as TE from "fp-ts/TaskEither";
import { Transaction } from "../../model";
import { Exception } from "../../magic";
export declare namespace TransactionChannel {
    const all: (userId: string) => TE.TaskEither<Exception.t, Transaction.Internal.t[]>;
    const getById: (userId: string) => (id: string) => TE.TaskEither<Exception.t, Transaction.Internal.t>;
    const create: (transaction: Transaction.Frontend.Create.t) => TE.TaskEither<Exception.t, Transaction.Internal.t>;
    const deleteById: (userId: string) => (id: string) => TE.TaskEither<Exception.t, void>;
}
export default TransactionChannel;
