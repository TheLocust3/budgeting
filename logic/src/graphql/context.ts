import Express from "express";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { User, Account, Rule } from "model";

type AccountContext = {
  account: O.Option<Account.Internal.t>;
  rules: O.Option<Rule.Internal.t[]>;
}

type Context = {
  user: O.Option<User.Internal.t>;
  physical: AccountContext;
  virtual: AccountContext;
}

declare global{
  namespace Express {
    interface Request {
      context: Context;
      user: User.Internal.t;
    }
  }
}

export const middleware = (request: Express.Request, response: Express.Response, next: Express.NextFunction) => {
  request.user = response.locals.user;
  request.context = {
      user: O.none
    , physical: { account: O.none, rules: O.none }
    , virtual: { account: O.none, rules: O.none }
  };

  next();
}
