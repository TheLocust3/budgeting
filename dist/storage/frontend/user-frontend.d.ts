import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { User } from "../../model";
import { Exception } from "../../magic";
export declare namespace UserFrontend {
    const all: (pool: Pool) => () => TE.TaskEither<Exception.t, User.Internal.t[]>;
    const getById: (pool: Pool) => (id: string) => TE.TaskEither<Exception.t, User.Internal.t>;
    const getByEmail: (pool: Pool) => (email: string) => TE.TaskEither<Exception.t, User.Internal.t>;
    const create: (pool: Pool) => (user: User.Frontend.Create.t) => TE.TaskEither<Exception.t, User.Internal.t>;
    const deleteById: (pool: Pool) => (id: string) => TE.TaskEither<Exception.t, void>;
    const login: (pool: Pool) => (email: string, password: string) => TE.TaskEither<Exception.t, User.Internal.t>;
    const setRole: (pool: Pool) => (role: string) => (id: string) => TE.TaskEither<Exception.t, User.Internal.t>;
}
export default UserFrontend;
