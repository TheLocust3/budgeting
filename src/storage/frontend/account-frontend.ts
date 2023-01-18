import { Pool } from "pg";
import { Logger } from "pino";
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
  export const all = (pool: Pool) => (log: Logger) => (userId: string): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    return AccountsTable.all(pool)(log)(userId);
  };

  export const getById = (pool: Pool) => (log: Logger) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        id
      , AccountsTable.byId(pool)(log)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Account.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (account) => TE.of(account)
        ))
    );
  };

  export const getByIdAndUserId = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        id
      , getById(pool)(log)
      , TE.chain((account) => {
          if (account.userId == userId) {
            return TE.of(account);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const withRules = (pool: Pool) => (log: Logger) => <T>(account: Account.Internal.t & T): TE.TaskEither<Exception.t, Account.Internal.t & T & Account.Internal.WithRules> => {
    return pipe(
        RuleFrontend.getByAccountId(pool)(log)(account.userId)(account.id)
      , TE.map((rules) => { return { ...account, rules: rules }; })
    );
  };

  export const withChildren = (pool: Pool) => (log: Logger) => <T>(account: Account.Internal.t & T): TE.TaskEither<Exception.t, Account.Internal.t & T & Account.Internal.WithChildren> => {
    return pipe(
        account.id
      , AccountsTable.childrenOf(pool)(log)
      , TE.map((children) => { return { ...account, children: children }; })
    );
  };

  export const create = (pool: Pool) => (log: Logger) => (account: Account.Frontend.Create.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        account
      , AccountsTable.create(pool)(log)
    );
  };

  export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , AccountsTable.deleteById(pool)(log)(userId)
    );
  };
}

export default AccountFrontend;
