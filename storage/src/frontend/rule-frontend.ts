import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { AccountEntry } from "../entry/account-entry";

import { Account, Rule } from "model";
import { Exception } from "magic";

export namespace RuleFrontend {
  export const allByAccount = (userEmail: string) => (accountId: string): TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
    return pipe(
        AccountEntry.byId(userEmail)(accountId)
      , TE.map((account) => account.rules)
    );
  };

  export const create =
    (userEmail: string) =>
    (accountId: string) =>
    (rule: Rule.Internal.t): TE.TaskEither<Exception.t, Rule.Internal.t> => {
    return AccountEntry.insertRule(userEmail)(accountId)(rule);
  };

  export const deleteById = (userEmail: string) => (accountId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return AccountEntry.deleteRuleById(userEmail)(accountId)(id);
  };
}
