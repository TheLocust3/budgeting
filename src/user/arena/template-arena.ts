import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Arena from "./index";

import { Template } from "../../model";
import { TemplateFrontend } from "../../storage";
import { Exception } from "../../magic";

export type t = Template.Internal.t[];

export const resolve = 
  (pool: Pool) => 
  (accountId: string) =>
  (arena: Arena.t): TE.TaskEither<Exception.t, Template.Internal.t[]> => {
  return TemplateFrontend.getByAccountId(pool)(arena.user.id)(accountId)
}
