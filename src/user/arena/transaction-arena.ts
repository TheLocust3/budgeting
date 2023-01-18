import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Arena from "./index";

import { Frontend } from "../../engine";
import { User, Account, Transaction, Rule, Materialize as MaterializeModel } from "../../model";
import { Exception } from "../../magic";

export type t = Frontend.ForAccount.Result.t;

export const resolve = 
  (pool: Pool) => 
  (log: Logger) =>
  (accountId: string) =>
  (arena: Arena.t): TE.TaskEither<Exception.t, t> => {
  return Frontend.ForAccount.execute(pool)(log)(arena.user.id)(accountId);
}
