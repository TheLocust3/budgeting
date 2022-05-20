import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Arena from "./index";

import { User, Account, Rule, Materialize } from "../../model";
import { RuleFrontend } from "../../storage";
import { Exception } from "../../magic";

export type t = Rule.Internal.t[];

export const resolve = 
  (pool: Pool) => 
  (accountId: string) =>
  (arena: Arena.t): TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
  return RuleFrontend.getByAccountId(pool)(arena.user.id)(accountId)
}
