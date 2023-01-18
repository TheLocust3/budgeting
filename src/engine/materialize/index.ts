import crypto from "crypto";
import { Pool } from "pg";
import { Logger } from "pino";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import * as Plan from "./plan";
import * as Materializer from "./materializer";

import { Transaction, Rule, Account, Materialize } from "../../model";
import { AccountFrontend, TransactionFrontend, RuleFrontend } from "../../storage";
import { Exception, Format } from "../../magic";

export const linkedAccounts = (pool: Pool) => (log: Logger) => (account: Account.Internal.Rich): TE.TaskEither<Exception.t, Account.Internal.Rich[]> => {
  return O.match(
      () => TE.of([])
    , (parentId: string) => pipe(
          TE.Do
        , TE.bind("parent", () => pipe(
              parentId
            , AccountFrontend.getById(pool)(log)
            , TE.chain(AccountFrontend.withRules(pool)(log))
            , TE.chain(AccountFrontend.withChildren(pool)(log))
          ))
        , TE.bind("rest", ({ parent }) => linkedAccounts(pool)(log)(parent))
        , TE.map(({ parent, rest }) => rest.concat(parent))
      )
  )(account.parentId);
};

const getSafe = (obj: any) => (key: string): any | undefined => {
  if (key in obj) {
    return obj[key];
  } else {
    return undefined;
  }
}

const executeStage = (stage: Plan.Stage) => (materialized: Materialize.Internal.t): Materialize.Internal.t => {
  const flow = Materializer.build(stage);

  const maybeElements = getSafe(materialized.tagged)(stage.tag);
  const elements: Transaction.Internal.t[] = maybeElements ? maybeElements : [];
  return pipe(
      elements
    , A.map(flow)
    , A.reduce(<Materialize.Internal.t>{ conflicts: [], tagged: {}, untagged: [] }, ({ conflicts, tagged, untagged }, element) => {
        switch (element._type) {
          case "Conflict":
            return { conflicts: conflicts.concat(element), tagged: tagged, untagged: untagged };
          case "TaggedSet":
            A.map((element: Materializer.Tagged) => {
              const maybeElements = getSafe(tagged)(element.tag);
              if (maybeElements) {
                tagged[element.tag] = maybeElements.concat(element.element);
              } else {
                tagged[element.tag] = [element.element];
              }
            })(element.elements);
            
            return { conflicts: conflicts, tagged: tagged, untagged: untagged };
          case "Untagged":
            return { conflicts: conflicts, tagged: tagged, untagged: untagged.concat(element.element) };
        }
      })
  );
};

export const executePlan = (plan: Plan.t) => (transactions: Transaction.Internal.t[]): Materialize.Internal.t => {
  if (plan.stages.length < 1) {
    return {
        conflicts: []
      , tagged: {}
      , untagged: transactions
    };
  } else {
    const head = plan.stages[0];

    const tagged = { [head.tag]: transactions };
    return pipe(
        plan.stages
      , A.map(executeStage)
      , A.reduce(<Materialize.Internal.t>{ conflicts: [], tagged: tagged, untagged: [] }, (materialized, stage) => {
          return stage(materialized);
        })
    );
  }
};

export const execute = (id: string) => (pool: Pool) => (log: Logger) => (account: Account.Internal.Rich): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
  log.info(`[${id}] materialize - starting for account ${JSON.stringify(account, null, 2)}}`);
  
  return pipe(
      account
    , linkedAccounts(pool)(log)
    , TE.chain((accounts) => {
        const plan = Plan.build(accounts.concat(account));
        log.info(`[${id}] materialize - with plan ${JSON.stringify(plan, null, 2)}`);

        return pipe(
            TransactionFrontend.all(pool)(log)(account.userId)
          , TE.map(executePlan(plan))
        );
      })
  );
};

export const account = (pool: Pool) => (log: Logger) => (userId: string) => (accountId: string): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
  return pipe(
      AccountFrontend.getByIdAndUserId(pool)(log)(userId)(accountId)
    , TE.chain(AccountFrontend.withRules(pool)(log))
    , TE.chain(AccountFrontend.withChildren(pool)(log))
    , TE.chain((account) => execute(crypto.randomUUID())(pool)(log)(account))
  );
}