import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as Context from './context';
import Mutation from './mutation';
import * as Types from "../graphql/types";

import { Pipe } from "../../magic";
import { User } from "../../model";
import { UserFrontend } from "../../storage";

namespace ListUsers {
  const resolve = (source: any, args: any, context: Context.t): Promise<User.Internal.t[]> => {
    return pipe(
        UserFrontend.all(context.pool)()
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.User.t))
    , resolve: resolve
  };
}

namespace GetUser {
  type Args = { id: string };
  const Args = {
    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<User.Internal.t> => {
    return pipe(
        UserFrontend.getById(context.pool)(id)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.User.t)
    , args: Args
    , resolve: resolve
  };
}

const query = new graphql.GraphQLObjectType({
    name: 'Query'
  , fields: {
      users: ListUsers.t,
      user: GetUser.t
    }
});

const schema = new graphql.GraphQLSchema({ query: query, mutation: Mutation });

export default schema;