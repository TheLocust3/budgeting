import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import * as MaterializePlan from "../materialize/plan";

import { Transaction, Materialize as MaterializeModel } from "../../model";
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
        key: string;
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
    reductions: GroupByAndReduce.t<any, any>[];
  }
}

export namespace Result {
  export type t = {
    materialized: MaterializeModel.Internal.t;
    reductions: { [key: string]: any }
  }
}

export namespace Executor {
  export const run = (plan: Plan.t): TE.TaskEither<Exception.t, Result.t> => {
    throw new Error("TODO");
  }
}
