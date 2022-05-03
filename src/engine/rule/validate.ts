import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Account, Rule } from "../../model";
import { AccountFrontend } from "../../storage";
import { Exception } from "../../magic";

namespace Validate {
  type Context = {
    account: Account.Internal.Rich;
  }

  const splitByPercent = (context: Context) => (body: Rule.Internal.Split.SplitByPercent): boolean => {
    const validAccounts = A.reduce(
        true
      , (acc: boolean, split: Rule.Internal.Split.Percent) => acc && context.account.children.includes(split.account)
    )(body.splits);
    const total = A.reduce(
        0
      , (acc: number, split: Rule.Internal.Split.Percent) => acc + split.percent
    )(body.splits);

    return validAccounts && total === 1;
  };

  const splitByValue = (context: Context) => (body: Rule.Internal.Split.SplitByValue): boolean => {
    const validAccounts = A.reduce(
        true
      , (acc: boolean, split: Rule.Internal.Split.Value) => acc && context.account.children.includes(split.account)
    )(body.splits);
    const validRemainder = context.account.children.includes(body.remainder);

    return validAccounts && validRemainder;
  };

  const include = (context: Context) => (body: Rule.Internal.Include.t): boolean => {
    return !A.exists((rule: Rule.Frontend.Create.t) => rule.rule._type !== "Attach" && rule.rule._type !== "Include")(context.account.rules); // include cannot be used with splits
  };

  const buildContext = (pool: Pool) => (body: Rule.Frontend.Create.t): TE.TaskEither<Exception.t, Context> => {
    return pipe(
        body.accountId
      , AccountFrontend.getById(pool)
      , TE.chain(AccountFrontend.withRules(pool))
      , TE.chain(AccountFrontend.withChildren(pool))
      , TE.map((account) => { return { account: account }; })
    );
  };

  export const rule = (pool: Pool) => (body: Rule.Frontend.Create.t): TE.TaskEither<Exception.t, Rule.Frontend.Create.t> => {
    const inner = body.rule;
    return pipe(
        body
      , buildContext(pool)
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

export default Validate;
