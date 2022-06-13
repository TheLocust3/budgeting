import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import { Frontend, Builder } from '../ir';
import { Transaction, Materialize as MaterializeModel } from "../../model";
import { Exception } from "../../magic";

export namespace ForAccount {
  export namespace Result {
    export type TaggedAccount = { transactions: Transaction.Internal.t[], total: number };

    export type t = {
        conflicts: MaterializeModel.Internal.Conflict[];
        tagged: Record<string, TaggedAccount>;
        untagged: Transaction.Internal.t[];
        total: number;
    };
  }

  export const execute = (pool: Pool) => (userId: string) => (accountId: string): TE.TaskEither<Exception.t, Result.t> => {
    const builder: Builder.ForAccount.t = {
        userId: userId
      , accountId: accountId
      , aggregations: {
            total: { group: { _type: "Empty" }, aggregate: { _type: "Sum" } }
          , totalPerAccount: { group: { _type: "Account" }, aggregate: { _type: "Sum" } }
        }
    };

    return pipe(
        Builder.ForAccount.build(pool)(builder)
      , TE.chain(Frontend.execute(pool))
      , TE.map(({ materialized, reductions }) => {
          const tagged = pipe(
              Object.keys(materialized.tagged)
            , A.map((account) => ({ account: account, transactions: materialized.tagged[account], total: <number>reductions["totalPerAccount"][account] }))
            , A.reduce(<Record<string, Result.TaggedAccount>>{}, (acc, { account, transactions, total }) => {
                return { ...acc, [account]: { transactions: transactions, total: total } };
              })
          );

          return {
              conflicts: materialized.conflicts
            , tagged: tagged
            , untagged: materialized.untagged
            , total: <number>reductions["total"][""]
          };
        })
    );
  }
}