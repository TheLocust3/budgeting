import { Pool } from "pg";
import { Logger } from "pino";
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
    export namespace SortBy {
      export type Order = "Ascending" | "Descending";

      export type t = {
        field: Transaction.Internal.Field.t;
        order: Order;
      }

      export const compare = (sortBy: t) => (left: Transaction.Internal.t, right: Transaction.Internal.t): number => {
        const order = sortBy.order == "Ascending" ? 1 : -1;

        const leftValue = left[sortBy.field];
        const rightValue = right[sortBy.field];

        if (leftValue > rightValue) {
          return 1 * order;
        } else if (leftValue < rightValue) {
          return -1 * order;
        } else {
          return 0;
        }
      }
    }

    export type t = {
      plan: MaterializePlan.t;
      sortBy: O.Option<SortBy.t>;
    }
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
    queryId: string;
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
    const sortBy = (transactions: Transaction.Internal.t[]): Transaction.Internal.t[] => {
      return pipe(
          plan.materialize.sortBy
        , O.match(
              () => transactions
            , (sortBy) => transactions.sort(Plan.Materialize.SortBy.compare(sortBy))
          )
      );
    }

    return (transactions: Transaction.Internal.t[]): Result.t => {
      const materialized = Materializer.executePlan(plan.materialize.plan)(transactions);
      const sorted: MaterializeModel.Internal.t = {
          conflicts: materialized.conflicts
        , tagged: pipe(materialized.tagged, MaterializeModel.Internal.Tagged.map(sortBy))
        , untagged: sortBy(materialized.untagged)
      }

      const reduced = pipe(
          Object.keys(plan.reductions)
        , A.map((key) => ({ key: key, reduction: plan.reductions[key] }))
        , A.map(({ key, reduction }) => ({ key: key, run: buildReducation(reduction) }))
        , A.map(({ key, run }) => ({ key: key, out: run(sorted) }))
        , A.reduce(<Result.Reductions>{}, (acc, { key, out }) => {
            return { ...acc, [key]: out };
          })
      );
      
      return {
          materialized: sorted
        , reductions: reduced
      }
    }
  }

  const sourceFor = (pool: Pool) => (log: Logger) => (plan: Plan.t): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
    const buildTransactionsForUser = (planSource: Plan.Source.TransactionsForUser): TE.TaskEither<Exception.t, Transaction.Internal.t[]> => {
      log.info(`Frontend.sourceFor[${plan.queryId}] - getting transactions for user ${planSource.userId}`)
      return TransactionFrontend.all(pool)(planSource.userId);
    }

    switch (plan.source._type) {
      case "TransactionsForUser":
        return buildTransactionsForUser(plan.source);
    }
  }

  export const execute = (pool: Pool) => (log: Logger) => (plan: Plan.t): TE.TaskEither<Exception.t, Result.t> => {
    log.info(`Frontend.execute[${plan.queryId}] - ${JSON.stringify(plan, null, 2)}`)
    const executablePlan = build(plan);

    return pipe(
        sourceFor(pool)(log)(plan)
      , TE.map(executablePlan)
      , TE.map((result) => {
          log.info(`Frontend.execute[${plan.queryId}] - complete`)
          return result;
        })
    );
  }
}

export namespace Builder {
  export namespace Materialize {
    export type t = {
      sortBy: O.Option<Plan.Materialize.SortBy.t>;
    }
  }

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
      queryId: string;
      userId: string;
      accountId: string;
      materialize: Materialize.t;
      aggregations: GroupAndAggregate.t;
    };

    export const build = (pool: Pool) => (log: Logger) => (builder: t): TE.TaskEither<Exception.t, { plan: Plan.t, account: Account.Internal.Rich }> => {
      const buildAccount = (): TE.TaskEither<Exception.t, Account.Internal.Rich> => {
        return pipe(
            AccountFrontend.getByIdAndUserId(pool)(builder.userId)(builder.accountId)
          , TE.chain(AccountFrontend.withRules(pool))
          , TE.chain(AccountFrontend.withChildren(pool))
        );
      }

      log.info(`ForAccount.build[${builder.queryId}] - ${JSON.stringify(builder, null, 2)}`)

      return pipe(
          TE.Do
        , TE.bind("account", () => buildAccount())
        , TE.bind("linkedAccounts", ({ account }) => pipe(Materializer.linkedAccounts(pool)(account), TE.map((accounts) => accounts.concat(account))))
        , TE.bind("materializePlan", ({ linkedAccounts }) => TE.of(MaterializePlan.build(linkedAccounts)))
        , TE.map(({ account, materializePlan }) => {
            const plan = <Plan.t> {
                queryId: builder.queryId
              , source: { _type: "TransactionsForUser", userId: builder.userId }
              , materialize: {
                  plan: materializePlan,
                  sortBy: builder.materialize.sortBy
                }
              , reductions: GroupAndAggregate.build(builder.aggregations)
            };

            log.info(`ForAccount.build[${builder.queryId}] - ${JSON.stringify(plan, null, 2)} - complete`)

            return { plan: plan, account: account };
          })
      );
    }
  }
}
