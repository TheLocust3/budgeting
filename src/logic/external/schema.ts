import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { UserResource } from "../../user";
import * as Context from './context';
import * as Types from "../graphql/types";
import { JWT } from "../util";

import { User } from "../../model";
import { Pipe } from "../../magic";
import { UserFrontend } from "../../storage";

export namespace Login {
  type Token = { token: string; };
  const Token = new graphql.GraphQLObjectType({
      name: 'Token'
    , fields: {
        token: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  })

  type Args = { email: string; password: string; };
  const Args = {
      email: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , password: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { email, password }: Args, context: Context.t): Promise<Token> => {
    return pipe(
        UserFrontend.login(context.pool)(email, password)
      , TE.map((user) => JWT.sign(user))
      , TE.map((token) => ({ token: token }))
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Token)
    , args: Args
    , resolve: resolve
  };
}

export namespace CreateUser {
  type CreatedUser = {
    id: string;
    email: string;
    password: string;
    role: string;
    token: string;
  };
  const CreatedUser = new graphql.GraphQLObjectType({
      name: 'CreatedUser'
    , fields: {
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        email: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        password: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        role: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        token: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  })

  type Args = { email: string; password: string; };
  const Args = {
      email: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , password: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { email, password }: Args, context: Context.t): Promise<CreatedUser> => {
    return pipe(
        UserResource.create(context.pool)({ id: context.id, email: email, password: password, role: User.DEFAULT_ROLE })
      , TE.map((user) => ({ token: JWT.sign(user), ...user }))
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(CreatedUser)
    , args: Args
    , resolve: resolve
  };
}

const query = new graphql.GraphQLObjectType({
    name: 'Query'
  , fields: {
      _ignore: { type: graphql.GraphQLString } // JK: a single field is required
    }
});

const mutation = new graphql.GraphQLObjectType({
    name: 'Mutation'
  , fields: {
        login: Login.t
      , createUser: CreateUser.t
    }
});

const schema = new graphql.GraphQLSchema({ query: query, mutation: mutation });

export default schema;
