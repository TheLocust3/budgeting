import crypto from "crypto";
import { Pool } from "pg";
import pino from "pino";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { UserArena, UserResource } from "../../src/user";

import { User } from "../../src/model";
import { Exception, Plaid } from "../../src/magic";

export const pool = new Pool();

export const log : pino.Logger = pino();
log.level = "error";

export const plaidClient = Plaid.buildClient();

type Wrapped<T> = (arena: UserArena.t) => TE.TaskEither<Exception.t, T>;
export type Wrapper = <T>(func: Wrapped<T>) => TE.TaskEither<Exception.t, T>;
export const wrapperBuilder = (user: User.Internal.t) => <T>(func: Wrapped<T>): TE.TaskEither<Exception.t, T> => {
  return pipe(
      UserArena.fromId(pool)(log)(crypto.randomUUID())(user.id)
    , TE.chain((arena: UserArena.t) => func(arena))
  );
}