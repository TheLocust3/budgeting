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
      export type t<Key> = (account: string, transaction: Transaction.Internal.t) => Key;
    }

    export namespace Reduce {
      export type t<Key, Out> = {
        empty: Out;
        reduce: (acc: Out, input: { key: Key, transaction: Transaction.Internal.t }) => Out;
      }
    }

    export type t<Key, Out> = {
      groupBy: GroupBy.t<Key>;
      reduce: Reduce.t<Key, Out>;
    };
  }

  export type Reductions = { [key: string]: GroupByAndReduce.t<any, any> };

  export type t = {
    source: Source.t;
    materialize: Materialize.t;
    reductions: Reductions;
  }
}

export namespace Result {
  export namespace GroupByAndReduce {
    export type t<Key, Out> = { value: Out, _witness: Plan.GroupByAndReduce.t<Key, Out> }
  }

  export type Reductions = { [key: string]: GroupByAndReduce.t<any, any> };
  export type t = {
    materialized: MaterializeModel.Internal.t;
    reductions: Reductions;
  }
}

export namespace Frontend {
  type ExecutablePlan = (transaction: Transaction.Internal.t[]) => Result.t;

  const buildReducation = <Key, Out>(reduction : Plan.GroupByAndReduce.t<Key, Out>): (materialized: MaterializeModel.Internal.t) => Out => {
    throw new Error("TODO")
  }

  const build = (plan: Plan.t): ExecutablePlan => {
    return (transactions: Transaction.Internal.t[]): Result.t => {
      const materialized = Materializer.executePlan(plan.materialize)(transactions);
      const reduced = pipe(
          Object.keys(plan.reductions)
        , A.map((key) => ({ key: key, reduction: plan.reductions[key] }))
        , A.map(({ key, reduction }) => ({ key: key, reduction: reduction, run: buildReducation(reduction) }))
        , A.map(({ key, reduction, run }) => ({ key: key, reduction: reduction, out: run(materialized) }))
        , A.reduce(<Result.Reductions>{}, (acc, { key, reduction, out }) => {
            return { ...acc, [key]: { value: out, _witness: reduction } };
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

      export const build = (group: t): Plan.GroupByAndReduce.GroupBy.t<any> => {
        switch (group._type) {
          case "Empty":
            return (account: string, transaction: Transaction.Internal.t) => "";
          case "Account":
            return (account: string, transaction: Transaction.Internal.t) => account;
        }
      }
    }

    export namespace Aggregate {
      export type Sum = { _type: "Sum" };

      export type t = Sum;

      // TODO: JK it feels like we can bind the type of an aggregation with its groupBy
      export const build = (aggregate: t): Plan.GroupByAndReduce.Reduce.t<any, any> => {
        switch (aggregate._type) {
          case "Sum":
            return <Plan.GroupByAndReduce.Reduce.t<any, number>>{
                empty: 0
              , reduce: (acc, { transaction }) => {
                  return acc + transaction.amount;
                }
            };
        }
      }
    }

    export type t = { [key: string]: { group: Group.t, aggregate: Aggregate.t } };

    export const build = (aggregations: t): Plan.Reductions => {
      const buildOne = ({ group, aggregate }: { group: Group.t, aggregate: Aggregate.t }): Plan.GroupByAndReduce.t<any, any> => {
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
      aggregations: GroupAndAggregate.t
    };

    export const build = (pool: Pool) => (builder: t): TE.TaskEither<Exception.t, Plan.t> => {
      const buildAccount = (): TE.TaskEither<Exception.t, Account.Internal.Rich> => {
        return pipe(
            AccountFrontend.getByIdAndUserId(pool)(builder.userId)(builder.accountId)
          , TE.chain(AccountFrontend.withRules(pool))
          , TE.chain(AccountFrontend.withChildren(pool))
        );
      }

      return pipe(
          buildAccount()
        , TE.chain((account) => pipe(Materializer.linkedAccounts(pool)(account), TE.map((accounts) => accounts.concat(account))))
        , TE.map(MaterializePlan.build)
        , TE.map((materializePlan) => {
            return <Plan.t> {
                source: { _type: "TransactionsForUser", userId: builder.userId }
              , materialize: materializePlan
              , reductions: GroupAndAggregate.build(builder.aggregations)
            };
          })
      );
    }
  }
}
