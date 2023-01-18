import crypto from "crypto";
import { Pool } from "pg";
import { Logger } from "pino";
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

  export const execute = (pool: Pool) => (log: Logger) => (userId: string) => (accountId: string): TE.TaskEither<Exception.t, Result.t> => {
    const round = (num: number): number => +(num.toFixed(2)) // TODO: JK this round is not _technically_ correct for exact amounts

    const queryId = crypto.randomUUID();

    const builder: Builder.ForAccount.t = {
        queryId: queryId
      , userId: userId
      , accountId: accountId
      , materialize: {
          sortBy: O.some({
              field: "authorizedAt"
            , order: "Descending"
          })
        }
      , aggregations: {
            total: { group: { _type: "Empty" }, aggregate: { _type: "Sum" } }
          , totalPerAccount: { group: { _type: "Account" }, aggregate: { _type: "Sum" } }
        }
    };

    log.info(`ForAccount.execute[${queryId}] - user: ${userId} account: ${accountId}`)

    return pipe(
        Builder.ForAccount.build(pool)(log)(builder)
      , TE.chain(({ account, plan }) => pipe(Frontend.execute(pool)(log)(plan), TE.map((result) => ({ account, result }))))
      , TE.map(({ account, result }) => {
          log.info(`ForAccount.execute[${queryId}] - user: ${userId} account: ${account} - complete`)

          const { materialized, reductions } = result;

          const tagged = pipe(
              account.children
            , A.map((account) => {
                const transactions = materialized.tagged[account] === undefined ? [] : materialized.tagged[account];
                const total = reductions["totalPerAccount"][account] === undefined ? 0 : round(<number>reductions["totalPerAccount"][account]);

                return { account: account, transactions: transactions, total: total };
              })
            , A.reduce(<Record<string, Result.TaggedAccount>>{}, (acc, { account, transactions, total }) => {
                return { ...acc, [account]: { transactions: transactions, total: total } };
              })
          );

          const total = reductions["total"][""] === undefined ? 0 : round(<number>reductions["total"][""]);

          return {
              conflicts: materialized.conflicts
            , tagged: tagged
            , untagged: materialized.untagged
            , total: total
          };
        })
    );
  }
}