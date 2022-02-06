import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import RuleFrontend from "../frontend/rule-frontend";
import * as Plan from "./plan";
import * as Materializer from "./materializer";

import { Account, Rule, Transaction } from "model";
import { AccountFrontend, TransactionFrontend } from "storage";
import { Exception, Format } from "magic";

export type t = {
  conflicts: Materializer.Conflict[];
  tagged: Map<string, Transaction.Internal.t[]>;
  untagged: Transaction.Internal.t[];
};

namespace Conflict {
  export const to = (conflict: Materializer.Conflict): any => {
    return {
        element: pipe(conflict.element, Transaction.Internal.Json.to)
      , rules: conflict.rules
    };
  };
}

namespace Tagged {
  export const to = (tagged: { [tag: string]: Transaction.Internal.t[] }) => (tag: string): any => {
    return { [tag]: pipe(tagged[tag], A.map(Transaction.Internal.Json.to)) };
  };
}

export const Json = new class implements Format.Formatter<t, any> {
  public from = (obj: any): E.Either<Exception.t, t> => {
    return E.throwError(Exception.throwInternalError) // TODO: JK
  }

  public to = (materialized: t): any => {
    const tagged = A.reduce({}, (tagged: object, [tag, transactions]: [string, Transaction.Internal.t[]]) => {
      return { ...tagged, [tag]: pipe(transactions, A.map(Transaction.Internal.Json.to)) };
    })(Array.from(materialized.tagged.entries()));

    return {
        conflicts: A.map(Conflict.to)(materialized.conflicts)
      , tagged: tagged
      , untagged: pipe(materialized.untagged, A.map(Transaction.Internal.Json.to))
    };
  }
}

const executeStage = (stage: Plan.Stage) => (materialized: t): t => {
  const flow = Materializer.build(stage);

  const maybeElements = materialized.tagged.get(stage.tag);
  const elements: Transaction.Internal.t[] = maybeElements ? maybeElements : [];
  return pipe(
      elements
    , A.map(flow)
    , A.reduce(<t>{ conflicts: [], tagged: new Map(), untagged: [] }, ({ conflicts, tagged, untagged }, element) => {
        switch (element._type) {
          case "Conflict":
            return { conflicts: conflicts.concat(element), tagged: tagged, untagged: untagged };
          case "TaggedSet":
            A.map((element: Materializer.Tagged) => {
              const maybeElements = tagged.get(element.tag);
              if (maybeElements) {
                tagged.set(element.tag, maybeElements.concat(element.element));
              } else {
                tagged.set(element.tag, [element.element]);
              }
            })(element.elements);
            
            return { conflicts: conflicts, tagged: tagged, untagged: untagged };
          case "Untagged":
            return { conflicts: conflicts, tagged: tagged, untagged: untagged.concat(element.element) };
        }
      })
  );
};

const executePlan = (plan: Plan.t) => (transactions: Transaction.Internal.t[]): t => {
  if (plan.stages.length < 1) {
    return {
        conflicts: []
      , tagged: new Map()
      , untagged: transactions
    };
  } else {
    const head = plan.stages[0];

    const tagged = new Map();
    tagged.set(head.tag, transactions);
    return pipe(
        plan.stages
      , A.map(executeStage)
      , A.reduce(<t>{ conflicts: [], tagged: tagged, untagged: [] }, (materialized, stage) => {
          return stage(materialized);
        })
    );
  }
};

const accountChain =
  (accountId: string) =>
  (accounts: Account.Internal.t[]): Account.Internal.t[] => {
  const chain = (accounts: Account.Internal.t[]) => (path: Account.Internal.t[]): Account.Internal.t[] => {
    return pipe(
        accounts
      , A.findFirst((account: Account.Internal.t) => account.id === accountId)
      , O.match(
            () => {
              return pipe(
                  accounts
                , A.map((account: Account.Internal.t) => chain(account.children)(A.append(account)(path)))
                , A.findFirst((path: Account.Internal.t[]) => path.length > 0)
                , O.match(
                      () => []
                    , (path) => path
                  )
              );
            }
          , (account) => A.append(account)(accounts)
        )
    );
  }

  return chain(accounts)([]);
}

export const execute =
  (id: string) =>
  (userEmail: string) =>
  (accountId: string) =>
  (accounts: Account.Internal.t[]): TE.TaskEither<Exception.t, t> => {
  console.log(`[${id}] materialize - starting for account ${accountId}`);

  const chain = accountChain(accountId)(accounts)

  const plan = Plan.build(chain);
  console.log(`[${id}] materialize - with plan ${JSON.stringify(plan, null, 2)}`);
  
  return pipe(
      TransactionFrontend.all(userEmail)
    , TE.map(executePlan(plan))
  );
};