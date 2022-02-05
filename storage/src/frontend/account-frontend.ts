import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { AccountEntry } from "../entry/account-entry";

import { Account } from "model";
import { Exception } from "magic";

export namespace AccountFrontend {
  export const allByUser = (userEmail: string): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    return AccountEntry.allByUser(userEmail);
  };

  export const byId = (userEmail: string) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return AccountEntry.byId(userEmail)(id);
  };

  export const create =
    (userEmail: string) =>
    (parentId: O.Option<string>) =>
    (account: Account.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return AccountEntry.insert(userEmail)(parentId)(account);
  };

  export const deleteById = (userEmail: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return AccountEntry.deleteById(userEmail)(id);
  };
}
