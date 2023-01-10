import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { UserArena, UserResource } from "../../user";
import * as Context from './context';
import * as Types from "../graphql/types";
import { asList } from "../graphql/util";

import { User } from "../../model";
import { UserFrontend, IntegrationFrontend, SourceFrontend } from "../../storage";
import { Exception, Reaper, Pipe } from "../../magic";

namespace MakeSuperuser {
  type Args = { id: string };
  const Args = {
    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<User.Internal.t> => {
    return pipe(
        UserFrontend.setRole(context.pool)(User.SUPERUSER_ROLE)(id)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.User.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace CreatePlaidIntegration {
  type Args = { userId: string, itemId: string; accessToken: string; accounts: Types.PlaidAccount.t[]; institutionName: string; };
  const Args = {
      userId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , itemId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , accessToken: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , accounts: { type: new graphql.GraphQLList(Types.PlaidAccount.t) }
    , institutionName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { userId, itemId, accessToken, accounts, institutionName }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserArena.fromId(context.pool)(context.id)(userId)
      , TE.chain((arena) => {
          return UserResource.Integration.create(context.pool)(context.plaidClient)(arena)({ institutionName: institutionName, accounts: asList(accounts) })({ item_id: itemId, access_token: accessToken });
        })
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}

namespace DeleteUser {
  type Args = { id: string };
  const Args = {
    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserFrontend.deleteById(context.pool)(id)
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}

const mutation = new graphql.GraphQLObjectType({
    name: 'Mutation'
  , fields: {
        deleteUser: DeleteUser.t
      , makeSuperuser: MakeSuperuser.t
      , createPlaidIntegraton: CreatePlaidIntegration.t
    }
});

export default mutation;
