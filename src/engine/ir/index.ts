import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import * as Materializer from "../materialize";
import * as MaterializePlan from "../materialize/plan";

import { Transaction, Materialize as MaterializeModel } from "../../model";
import { TransactionFrontend } from "../../storage";
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
      // run reductions
      // collect result
      throw new Error("TODO");
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
