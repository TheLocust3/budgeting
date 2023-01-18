import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Arena from "./index";

import { Notification } from "../../model";
import { NotificationFrontend } from "../../storage";
import { Exception } from "../../magic";

export type t = Notification.Internal.t[];

export const resolve = 
  (pool: Pool) => 
  (log: Logger) => 
  (arena: Arena.t): TE.TaskEither<Exception.t, t> => {
  return NotificationFrontend.all(pool)(log)(arena.user.id);
}
