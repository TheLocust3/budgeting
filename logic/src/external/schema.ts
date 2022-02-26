import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { UserResource } from "../user";
import * as Context from './context';
import * as Types from "../graphql/types";
import { JWT } from "../util";

import { User } from "model";
import { Pipe } from "magic";
import { UserFrontend } from "storage";

namespace Login {
  type Token = { token: string; };
  const Token = new graphql.GraphQLObjectType({
      name: 'Token'
    , fields: {
        token: { type: graphql.GraphQLString }
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
      type: Token
    , args: Args
    , resolve: resolve
  };
}

namespace CreateUser {
  type Args = { email: string; password: string; };
  const Args = {
      email: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , password: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { email, password }: Args, context: Context.t): Promise<User.Internal.t> => {
    return pipe(
        UserResource.create(context.pool)({ email: email, password: password, role: User.DEFAULT_ROLE })
      , Pipe.toPromise
    );
  }

  export const t = {
      type: Types.User.t
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