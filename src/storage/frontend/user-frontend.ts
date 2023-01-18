import { Pool } from "pg";
import { Logger } from "pino";
import bcrypt from "bcrypt";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { User } from "../../model";
import * as UsersTable from "../db/users-table";
import { Exception } from "../../magic";

export namespace UserFrontend {
  export const all = (pool: Pool) => (log: Logger) => (): TE.TaskEither<Exception.t, User.Internal.t[]> => {
    return UsersTable.all(pool)(log)();
  };

  export const getById = (pool: Pool) => (log: Logger) => (id: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        id
      , UsersTable.byId(pool)(log)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, User.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (user) => TE.of(user)
        ))
    );
  };

  export const getByEmail = (pool: Pool) => (log: Logger) => (email: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        email
      , UsersTable.byEmail(pool)(log)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, User.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (user) => TE.of(user)
        ))
    );
  };

  export const createFromFirebase = (pool: Pool) => (log: Logger) => (user: User.Frontend.FromFirebase.t): TE.TaskEither<Exception.t, User.Internal.t> => {
    return UsersTable.create(pool)(log)({ id: user.id, email: user.email, role: User.DEFAULT_ROLE });
  };

  export const create = (pool: Pool) => (log: Logger) => (user: User.Frontend.Create.t): TE.TaskEither<Exception.t, User.Internal.t> => {
    return UsersTable.create(pool)(log)(user);
  };

  export const deleteById = (pool: Pool) => (log: Logger) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , UsersTable.deleteById(pool)(log)
    );
  };

  export const setRole = (pool: Pool) => (log: Logger) => (role: string) => (id: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return UsersTable.setRole(pool)(log)(role)(id);
  };
}

export default UserFrontend;
