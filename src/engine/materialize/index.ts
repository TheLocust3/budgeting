import crypto from "crypto";
import { Pool } from "pg";
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

const linkedAccounts = (pool: Pool) => (account: Account.Internal.Rich): TE.TaskEither<Exception.t, Account.Internal.Rich[]> => {
  return O.match(
      () => TE.of([])
    , (parentId: string) => pipe(
          TE.Do
        , TE.bind("parent", () => pipe(
              parentId
            , AccountFrontend.getById(pool)
            , TE.chain(AccountFrontend.withRules(pool))
            , TE.chain(AccountFrontend.withChildren(pool))
          ))
        , TE.bind("rest", ({ parent }) => linkedAccounts(pool)(parent))
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

const executePlan = (plan: Plan.t) => (transactions: Transaction.Internal.t[]): Materialize.Internal.t => {
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

export const execute = (id: string) => (pool: Pool) => (account: Account.Internal.Rich): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
  // TODO: JK track materialize logs with id
  console.log(`[${id}] materialize - starting for account ${JSON.stringify(account, null, 2)}}`);
  
  return pipe(
      account
    , linkedAccounts(pool)
    , TE.chain((accounts) => {
        const plan = Plan.build(accounts.concat(account));
        console.log(`[${id}] materialize - with plan ${JSON.stringify(plan, null, 2)}`);

        return pipe(
            TransactionFrontend.all(pool)(account.userId)
          , TE.map(executePlan(plan))
        );
      })
  );
};

export const account = (pool: Pool) => (userId: string) => (accountId: string): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
  return pipe(
      AccountFrontend.getByIdAndUserId(pool)(userId)(accountId)
    , TE.chain(AccountFrontend.withRules(pool))
    , TE.chain(AccountFrontend.withChildren(pool))
    , TE.chain((account) => execute(crypto.randomUUID())(pool)(account))
  );
}