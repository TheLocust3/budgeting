import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Account, Rule } from "model";
import { AccountFrontend, RuleFrontend as StorageRuleFrontend } from "storage";
import { Exception } from "magic";

export namespace RuleFrontend {
  namespace Validate {
    type Context = {
      account: Account.Internal.t;
    }

    const splitByPercent = (context: Context) => (body: Rule.Internal.Split.SplitByPercent): boolean => {
      const children = A.map((account: Account.Internal.t) => account.id)(context.account.children);

      const validAccounts = A.reduce(
          true
        , (acc: boolean, split: Rule.Internal.Split.Percent) => acc && children.includes(split.account)
      )(body.splits);
      const total = A.reduce(
          0
        , (acc: number, split: Rule.Internal.Split.Percent) => acc + split.percent
      )(body.splits);

      return validAccounts && total === 1;
    };

    const splitByValue = (context: Context) => (body: Rule.Internal.Split.SplitByValue): boolean => {
      const children = A.map((account: Account.Internal.t) => account.id)(context.account.children);

      const validAccounts = A.reduce(
          true
        , (acc: boolean, split: Rule.Internal.Split.Value) => acc && children.includes(split.account)
      )(body.splits);
      const validRemainder = children.includes(body.remainder);

      return validAccounts && validRemainder;
    };

    const include = (context: Context) => (body: Rule.Internal.Include.t): boolean => {
      return !A.exists((rule: Rule.Internal.t) => rule.rule._type !== "Attach" && rule.rule._type !== "Include")(context.account.rules); // include cannot be used with splits
    };

    const buildContext = (userEmail: string) => (accountId: string): TE.TaskEither<Exception.t, Context> => {
      return pipe(
          AccountFrontend.getById(userEmail)(accountId)
        , TE.map((account) => { return { account: account }; })
      );
    };

    export const rule =
      (userEmail: string) =>
      (accountId: string) =>
      (body: Rule.Internal.t): TE.TaskEither<Exception.t, Rule.Internal.t> => {
      const inner = body.rule;
      return pipe(
          buildContext(userEmail)(accountId)
        , TE.chain((context) => {
            switch (inner._type) {
              case "Attach":
                return TE.of(body); // no validation on `Attach`
              case "SplitByPercent":
                if (splitByPercent(context)(inner)) {
                  return TE.of(body);
                } else {
                  return TE.throwError(Exception.throwInvalidRule);
                }
              case "SplitByValue":
                if (splitByValue(context)(inner)) {
                  return TE.of(body);
                } else {
                  return TE.throwError(Exception.throwInvalidRule);
                }
              case "Include":
                if (include(context)(inner)) {
                  return TE.of(body);
                } else {
                  return TE.throwError(Exception.throwInvalidRule);
                }
            }
          })
      );
    };
  }

  export const getByAccountId =
    (userEmail: string) =>
    (accountId: string): TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
    return StorageRuleFrontend.allByAccount(userEmail)(accountId);
  };

  export const create = 
    (userEmail: string) =>
    (accountId: string) =>
    (rule: Rule.Internal.t): TE.TaskEither<Exception.t, Rule.Internal.t> => {
    return pipe(
        Validate.rule(userEmail)(accountId)(rule)
      , TE.chain((rule) => StorageRuleFrontend.create(userEmail)(accountId)(rule))
    );
  };

  export const deleteById =
    (userEmail: string) =>
    (accountId: string) =>
    (id: string): TE.TaskEither<Exception.t, void> => {
    return StorageRuleFrontend.deleteById(userEmail)(accountId)(id);
  };
}

export default RuleFrontend;
