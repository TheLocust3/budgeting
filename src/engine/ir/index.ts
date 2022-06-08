import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
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
      export type t<Key> = (transaction: Transaction.Internal.t) => Key;
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

  export type t = {
    source: Source.t;
    materialize: Materialize.t;
    reductions: { [key: string]: GroupByAndReduce.t<any, any> };
  }
}

export namespace Result {
  export namespace GroupByAndReduce {
    export type t<Key, Out> = { value: Out, _witness: GroupByAndReduce.t<Key, Out> }
  }

  export type t = {
    materialized: MaterializeModel.Internal.t;
    reductions: { [key: string]: GroupByAndReduce.t<any, any> }
  }
}

export namespace Frontend {
  type ExecutablePlan = (transaction: Transaction.Internal.t[]) => Result.t;

  const build = (plan: Plan.t): ExecutablePlan => {
    return (transactions: Transaction.Internal.t[]): Result.t => {
      const materialized = Materializer.executePlan(plan.materialize)(transactions);
      
      return {
          materialized: materialized
        , reductions: {} // TODO: JK
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

      export type t = Empty;
    }

    export namespace Aggregate {
      export type Sum = { _type: "Sum" };

      export type t = Sum;
    }

    export type t = { [key: string]: { group: Group.t, aggregate: Aggregate.t } };

    export const build = (aggregations: t): { [key: string]: Plan.GroupByAndReduce.t<any, any> } => {
      return {}; // TODO: JK
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
