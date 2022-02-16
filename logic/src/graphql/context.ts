import Express from "express";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { User, Account, Rule } from "model";

export type Context = {
  user: User.Internal.t;
}

export const empty = (response: any) => {
  return {
      user: response.locals.user
  }
}
