import bcrypt from "bcrypt";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { UserEntry } from "../entry/user-entry";

import { User } from "model";
import { Exception } from "magic";

export namespace UserFrontend {
  export const getByEmail = (email: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return UserEntry.byEmail(email);
  };

  export const list = (): TE.TaskEither<Exception.t, string[]> => {
    return UserEntry.list();
  };  

  export const create = (user: User.Internal.t): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        TE.tryCatch(
            () => bcrypt.hash(user.password, 10)
          , E.toError
        )
      , TE.mapLeft((_) => Exception.throwInternalError)
      , TE.map((hashed) => { return { ...user, password: hashed }; })
      , TE.chain(UserEntry.create)
    );
  };

  export const login = (email: string, password: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        TE.Do
      , TE.bind("user", () => getByEmail(email))
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
}
