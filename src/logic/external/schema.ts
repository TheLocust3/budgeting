import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";
import { signInWithEmailAndPassword } from "firebase/auth";

import { UserResource } from "../../user";
import * as Context from './context';
import * as Types from "../graphql/types";
import { JWT } from "../util";

import { User } from "../../model";
import { Exception, Pipe } from "../../magic";
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
    if (password === null || password === "") { // JK: for my own sanity
      return pipe(
          <TE.TaskEither<Exception.t, Token>>TE.throwError(Exception.throwNotFound)
        , Pipe.toPromise
      )
    } else {
      return pipe(
          UserFrontend.login(context.pool)(email, password)
        , TE.map((user) => JWT.sign(user))
        , TE.orElse(() => pipe(
              signInWithEmailAndPassword(context.auth, email, password)
            , Pipe.fromPromise
            , TE.chain((res) => pipe(
                  res.user.getIdToken(true)
                , Pipe.fromPromise
              ))
          ))
        , TE.map((token) => ({ token: token }))
        , Pipe.toPromise
      );
    }
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
    }
});

const schema = new graphql.GraphQLSchema({ query: query, mutation: mutation });

export default schema;
