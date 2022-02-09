import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import AccountFrontend from "./account-frontend";

import { Account } from "model";
import { Rule } from "model";
import * as RulesTable from "../db/rules-table";
import { Exception } from "magic";

export namespace RuleFrontend {
  export const getByAccountId = (pool: Pool) => (accountId: string): TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
    return pipe(
        accountId
      , RulesTable.byAccountId(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  };

  export const getById = (pool: Pool) => (accountId: string) => (id: string): TE.TaskEither<Exception.t, Rule.Internal.t> => {
    return pipe(
        id
      , RulesTable.byId(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Rule.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (rule) => TE.of(rule)
        ))
      , TE.chain((rule) => {
          if (rule.accountId == accountId) {
            return TE.of(rule);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const create = (pool: Pool) => (rule: Rule.Internal.t): TE.TaskEither<Exception.t, Rule.Internal.t> => {
    return pipe(
        rule
      , RulesTable.create(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  };

  export const deleteById = (pool: Pool) => (accountId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , RulesTable.deleteById(pool)(accountId)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  };
}

export default RuleFrontend;
