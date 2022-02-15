import Express from "express";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { User, Account, Rule } from "model";

export namespace AccountContext {
  export type t = {
    account: Account.Internal.t;
    rules: O.Option<Rule.Internal.t[]>;
  }

  export type WithChildren = {
    children: (AccountContext.t & AccountContext.WithChildren)[];
  }
}

export type Context = {
  user: User.Internal.t;
  global: O.Option<AccountContext.t>;
  physical: O.Option<AccountContext.t & AccountContext.WithChildren>;
  virtual: O.Option<AccountContext.t & AccountContext.WithChildren>;
}

declare global{
  namespace Express {
    interface Request {
      context: Context;
    }
  }
}

export const middleware = (request: Express.Request, response: Express.Response, next: Express.NextFunction) => {
  request.context = {
      user: response.locals.user
    , global: O.none
    , physical: O.none
    , virtual: O.none
  };

  next();
}
