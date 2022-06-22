import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import RuleFrontend from "./rule-frontend";

import { Account } from "../../model";
import * as AccountsTable from "../db/accounts-table";
import { Exception } from "../../magic";

export namespace AccountFrontend {
  export const all = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    return AccountsTable.all(pool)(userId);
  };

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        id
      , AccountsTable.byId(pool)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Account.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (account) => TE.of(account)
        ))
    );
  };

  export const getByIdAndUserId = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        id
      , getById(pool)
      , TE.chain((account) => {
          if (account.userId == userId) {
            return TE.of(account);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const withRules = (pool: Pool) => <T>(account: Account.Internal.t & T): TE.TaskEither<Exception.t, Account.Internal.t & T & Account.Internal.WithRules> => {
    return pipe(
        RuleFrontend.getByAccountId(pool)(account.userId)(account.id)
      , TE.map((rules) => { return { ...account, rules: rules }; })
    );
  };

  export const withChildren = (pool: Pool) => <T>(account: Account.Internal.t & T): TE.TaskEither<Exception.t, Account.Internal.t & T & Account.Internal.WithChildren> => {
    return pipe(
        account.id
      , AccountsTable.childrenOf(pool)
      , TE.map((children) => { return { ...account, children: children }; })
    );
  };

  export const create = (pool: Pool) => (account: Account.Frontend.Create.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        account
      , AccountsTable.create(pool)
    );
  };

  export const deleteById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , AccountsTable.deleteById(pool)(userId)
    );
  };
}

export default AccountFrontend;
