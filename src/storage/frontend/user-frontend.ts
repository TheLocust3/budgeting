import { Pool } from "pg";
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
  export const all = (pool: Pool) => (): TE.TaskEither<Exception.t, User.Internal.t[]> => {
    return UsersTable.all(pool)();
  };

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        id
      , UsersTable.byId(pool)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, User.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (user) => TE.of(user)
        ))
    );
  };

  export const getByEmail = (pool: Pool) => (email: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        email
      , UsersTable.byEmail(pool)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, User.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (user) => TE.of(user)
        ))
    );
  };

  export const createFromFirebase = (pool: Pool) => (user: User.Frontend.FromFirebase.t): TE.TaskEither<Exception.t, User.Internal.t> => {
    return UsersTable.create(pool)({ id: user.id, email: user.email, role: User.DEFAULT_ROLE });
  };

  export const create = (pool: Pool) => (user: User.Frontend.Create.t): TE.TaskEither<Exception.t, User.Internal.t> => {
    return UsersTable.create(pool)(user);
  };

  export const deleteById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , UsersTable.deleteById(pool)
    );
  };

  export const setRole = (pool: Pool) => (role: string) => (id: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return UsersTable.setRole(pool)(role)(id);
  };
}

export default UserFrontend;
