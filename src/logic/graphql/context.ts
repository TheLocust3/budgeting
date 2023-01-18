import Express from "express";
import { Logger } from "pino";
import { Pool } from "pg";
import { PlaidApi } from "plaid";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { UserArena } from "../../user";

type Resolvable<T> = O.Option<Promise<T>>;

export type t = {
  log: Logger;
  id: string;
  pool: Pool;
  plaidClient: PlaidApi;
  arena: UserArena.t
}

export const empty = (request: any, response: any) => {
  return {
      log: request.log
    , id: response.locals.id
    , pool: request.app.locals.db
    , plaidClient: request.app.locals.plaidClient
    , arena: UserArena.empty(response.locals.id)(response.locals.user)
  }
}
