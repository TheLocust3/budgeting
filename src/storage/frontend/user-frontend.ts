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

  export const create = (pool: Pool) => (user: User.Frontend.Create.t): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        TE.tryCatch(
            () => bcrypt.hash(user.password, 10)
          , Exception.raise
        )
      , TE.map((hashed) => { return { ...user, password: hashed }; })
      , TE.chain(UsersTable.create(pool))
    );
  };

  export const deleteById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , UsersTable.deleteById(pool)
    );
  };

  export const login = (pool: Pool) => (email: string, password: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        TE.Do
      , TE.bind("user", () => getByEmail(pool)(email))
      , TE.bind("match", ({ user }) => TE.tryCatch(
          () => bcrypt.compare(password, user.password),
          () => Exception.throwInternalError
        ))
      , TE.chain(({ user, match }) => {
          if (match) {
            return TE.of(user);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const setRole = (pool: Pool) => (role: string) => (id: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return UsersTable.setRole(pool)(role)(id);
  };
}

export default UserFrontend;
