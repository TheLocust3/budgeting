import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Arena from "./index";

import { Frontend } from "../../engine";
import { User, Account, Transaction, Rule, Materialize as MaterializeModel } from "../../model";
import { Exception } from "../../magic";

export type t = MaterializeModel.Internal.t;

export const resolve = 
  (pool: Pool) => 
  (accountId: string) =>
  (arena: Arena.t): TE.TaskEither<Exception.t, MaterializeModel.Internal.t> => {

  // TODO: JK
  return pipe(
      Frontend.ForAccount.execute(pool)(arena.user.id)(accountId)
    , TE.map(({ conflicts, tagged, untagged }) => {
        const retagged = pipe(
            Object.keys(tagged)
          , A.map((account) => ({ account: account, transactions: tagged[account].transactions }))
          , A.reduce(<Record<string, Transaction.Internal.t[]>>{}, (acc, { account, transactions }) => {
              return { ...acc, [account]: transactions };
            })
        );

        return <MaterializeModel.Internal.t>{ conflicts, untagged, tagged: retagged };
      })
  );
}
