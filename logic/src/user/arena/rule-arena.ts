import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Arena from "./index";
import RuleChannel from "../../channel/rule-channel";

import { User, Account, Rule, Materialize } from "model";
import { Exception } from "magic";

export type t = Rule.Internal.t[];

export const resolve = 
  (accountId: string) =>
  (arena: Arena.t): TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
  return RuleChannel.all(arena.user.id)(accountId);
}
