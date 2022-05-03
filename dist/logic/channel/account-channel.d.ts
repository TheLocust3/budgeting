import * as TE from "fp-ts/TaskEither";
import { Account, Materialize } from "../../model";
import { Exception } from "../../magic";
export declare namespace AccountChannel {
    const all: (userId: string) => TE.TaskEither<Exception.t, Account.Internal.t[]>;
    const getById: (userId: string) => (id: string) => TE.TaskEither<Exception.t, Account.Internal.t>;
    const create: (account: Account.Frontend.Create.t) => TE.TaskEither<Exception.t, Account.Internal.t>;
    const deleteById: (userId: string) => (id: string) => TE.TaskEither<Exception.t, void>;
    const materialize: (userId: string) => (id: string) => TE.TaskEither<Exception.t, Materialize.Internal.t>;
}
export default AccountChannel;
