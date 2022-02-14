import Express from "express";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { User } from "model";
import { UserFrontend } from "storage";
import { Exception } from "magic";

type Context = {
  user: O.Option<User.Internal.t>;
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
  request.context = { user: O.none };
  next();
}

const toPromise = <T>(task: TE.TaskEither<Exception.t, T>): Promise<T> => {
  return TE.match(
      (error: Exception.t) => { throw new Error(error._type) }
    , (out: T) => out
  )(task)();
}

const resolveUser = (request: Express.Request) => (id: string): TE.TaskEither<Exception.t, User.Internal.t> => {
  const context: Context = request.context;
  const pool: Pool = request.app.locals.db;

  return O.match(
      () => UserFrontend.getById(pool)(id)
    , (user: User.Internal.t) => TE.of(user)
  )(context.user);
}

type UserField = "id" | "email";
const resolveUserField = (field: UserField) => (source: any, args: any, request: Express.Request): Promise<string> => {
  const user: User.Internal.t = request.user;

  return pipe(
      resolveUser(request)(user.id)
    , TE.map((user) => user[field])
    , toPromise
  );
}

const accountType = new graphql.GraphQLObjectType({
  name: 'Account',
  fields: {
    id: { type: graphql.GraphQLString },
    name: { type: graphql.GraphQLString }
  }
});

const userType = new graphql.GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: graphql.GraphQLString, resolve: resolveUserField("id") },
    email: { type: graphql.GraphQLString, resolve: resolveUserField("email") }
  }
});

// TODO: integrations/sources
const queryType = new graphql.GraphQLObjectType({
  name: 'Query',
  fields: {
      user: {
          type: userType
        , resolve: () => {
            console.log("test")
            return { pls: "pls"};
          }
      }
    , physical: {
        type: accountType
      }
    , virtual: {
        type: accountType
      }
  }
});

export const schema = new graphql.GraphQLSchema({ query: queryType });