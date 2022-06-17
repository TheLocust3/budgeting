import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import * as Materializer from "../materialize";
import * as MaterializePlan from "../materialize/plan";

import { Account, Transaction, Materialize as MaterializeModel } from "../../model";
import { AccountFrontend, TransactionFrontend } from "../../storage";
import { Exception } from "../../magic";

export namespace Plan {
  export namespace Source {
    export type TransactionsForUser = {
      _type: "TransactionsForUser";
      userId: string;
    };

    export type t = TransactionsForUser;
  }

  export namespace Materialize {
    export type t = MaterializePlan.t;
  }

  export namespace GroupByAndReduce {
    export namespace GroupBy {
      export type t = (input: { account: string, transaction: Transaction.Internal.t }) => string;
    }

    export namespace Reduce {
      export type t<Out> = {
        empty: Out;
        reduce: (acc: Out, input: { key: string, account: string, transaction: Transaction.Internal.t }) => Out;
      }
    }

    export type t<Out> = {
      groupBy: GroupBy.t;
      reduce: Reduce.t<Out>;
    };
  }

  export type Reductions = Record<string, GroupByAndReduce.t<any>>;

  export type t = {
    source: Source.t;
    materialize: Materialize.t;
    reductions: Reductions;
  }
}

export namespace Result {
  export namespace GroupByAndReduce {
    export type t<Out> = Record<string, Out>;
  }

  export type Reductions = Record<string, GroupByAndReduce.t<any>>;
  export type t = {
    materialized: MaterializeModel.Internal.t;
    reductions: Reductions;
  }
}

export namespace Frontend {
  type ExecutablePlan = (transaction: Transaction.Internal.t[]) => Result.t;

  const buildReducation = <Out>(reduction : Plan.GroupByAndReduce.t<Out>): (materialized: MaterializeModel.Internal.t) => Record<string, Out> => {
    const groupBy = reduction.groupBy;
    const empty = reduction.reduce.empty;
    const reduce = reduction.reduce.reduce;

    return (materialized: MaterializeModel.Internal.t): Record<string, Out> => {
      return pipe(
          Object.keys(materialized.tagged)
        , A.chain((account: string) => pipe(materialized.tagged[account], A.map((transaction) => ({ account: account, transaction: transaction }))))
        , A.map(({ account, transaction }: { account: string, transaction: Transaction.Internal.t }) => ({ key: groupBy({ account, transaction }), account: account, transaction: transaction }))
        , A.reduce(<Record<string, Out>>{}, (acc, { key, account, transaction }) => {
            let forGroup: Out = empty;
            if (key in acc) {
              forGroup = acc[key];
            }

            return { ... acc, [key]: reduce(forGroup, { key, account, transaction }) }
          })
      );
    }
  }

  const build = (plan: Plan.t): ExecutablePlan => {
    return (transactions: Transaction.Internal.t[]): Result.t => {
      const materialized = Materializer.executePlan(plan.materialize)(transactions);
      const reduced = pipe(
          Object.keys(plan.reductions)
        , A.map((key) => ({ key: key, reduction: plan.reductions[key] }))
        , A.map(({ key, reduction }) => ({ key: key, run: buildReducation(reduction) }))
        , A.map(({ key, run }) => ({ key: key, out: run(materialized) }))
        , A.reduce(<Result.Reductions>{}, (acc, { key, out }) => {
            return { ...acc, [key]: out };
          })
      );
      
      return {
          materialized: materialized
        , reductions: reduced
      }
    }
  }

  const sourceFor = (pool: Pool) => (plan: Plan.t): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    const buildTransactionsForUser = (planSource: Plan.Source.TransactionsForUser): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
      return TransactionFrontend.all(pool)(planSource.userId);
    }

    switch (plan.source._type) {
      case "TransactionsForUser":
        return buildTransactionsForUser(plan.source);
    }
  }

  export const execute = (pool: Pool) => (plan: Plan.t): TE.TaskEither<Exception.t, Result.t> => {
    const executablePlan = build(plan);

    return pipe(
        sourceFor(pool)(plan)
      , TE.map(executablePlan)
    );
  }
}

export namespace Builder {
  export namespace GroupAndAggregate {
    export namespace Group {
      export type Empty = { _type: "Empty" };
      export type Account = { _type: "Account" };

      export type t = Empty | Account;

      export const build = (group: t): Plan.GroupByAndReduce.GroupBy.t => {
        switch (group._type) {
          case "Empty":
            return ({ account, transaction }) => "";
          case "Account":
            return ({ account, transaction }) => account;
        }
      }
    }

    export namespace Aggregate {
      export type Sum = { _type: "Sum" };

      export type t = Sum;

      export const build = (aggregate: t): Plan.GroupByAndReduce.Reduce.t<any> => {
        switch (aggregate._type) {
          case "Sum":
            return <Plan.GroupByAndReduce.Reduce.t<number>>{
                empty: 0
              , reduce: (acc, { transaction }) => {
                  return acc + transaction.amount;
                }
            };
        }
      }
    }

    export type t = Record<string, { group: Group.t, aggregate: Aggregate.t }>;

    export const build = (aggregations: t): Plan.Reductions => {
      const buildOne = ({ group, aggregate }: { group: Group.t, aggregate: Aggregate.t }): Plan.GroupByAndReduce.t<any> => {
        return {
            groupBy: Group.build(group)
          , reduce: Aggregate.build(aggregate)
        };
      }

      return pipe(
          Object.keys(aggregations)
        , A.reduce(<Plan.Reductions>{}, (acc: Plan.Reductions, key: string) => {
            return { ...acc, [key]: buildOne(aggregations[key]) };
          })
      );
    }
  }

  export namespace ForAccount {
    export type t = {
      userId: string;
      accountId: string;
      aggregations: GroupAndAggregate.t;
    };

    export const build = (pool: Pool) => (builder: t): TE.TaskEither<Exception.t, { plan: Plan.t, account: Account.Internal.Rich }> => {
      const buildAccount = (): TE.TaskEither<Exception.t, Account.Internal.Rich> => {
        return pipe(
            AccountFrontend.getByIdAndUserId(pool)(builder.userId)(builder.accountId)
          , TE.chain(AccountFrontend.withRules(pool))
          , TE.chain(AccountFrontend.withChildren(pool))
        );
      }

      return pipe(
          TE.Do
        , TE.bind("account", () => buildAccount())
        , TE.bind("linkedAccounts", ({ account }) => pipe(Materializer.linkedAccounts(pool)(account), TE.map((accounts) => accounts.concat(account))))
        , TE.bind("materializePlan", ({ linkedAccounts }) => TE.of(MaterializePlan.build(linkedAccounts)))
        , TE.map(({ account, materializePlan }) => {
            const plan = <Plan.t> {
                source: { _type: "TransactionsForUser", userId: builder.userId }
              , materialize: materializePlan
              , reductions: GroupAndAggregate.build(builder.aggregations)
            };

            return { plan: plan, account: account };
          })
      );
    }
  }
}
