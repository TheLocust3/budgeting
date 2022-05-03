import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { UserArena, UserResource } from "../user";
import * as Context from './context';
import * as Types from "../graphql/types";
import { asList } from "../graphql/util";
import { AccountChannel, TransactionChannel } from "../channel";
import { JWT } from "../util";

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
      type: Types.User.t
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
        UserArena.fromId(context.pool)(userId)
      , TE.chain((arena) => {
          return UserResource.Integration.create(context.pool)(context.id)(arena)({ institutionName: institutionName, accounts: asList(accounts) })({ item_id: itemId, access_token: accessToken });
        })
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: Types.Void.t
    , args: Args
    , resolve: resolve
  };
}

namespace DeleteUser {
  type Args = { id: string };
  const Args = {
    id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  };

  const resolve = (source: any, { id }: Args, context: Context.t): boolean => {
    Reaper.enqueue((job) => {
      console.log(`DeleteUser[${job}] user ${id}`);

      return pipe(
          cleanup(id)(context)
        , TE.match(
              (error) => {
                console.log(`DeleteUser[${job}] failed with ${error}`)
                return false
              }
            , () => {
                console.log(`DeleteUser[${job}] complete`)
                return true;
              }
          )
      );
    });

    return true;
  }

  export const t = {
      type: Types.Void.t
    , args: Args
    , resolve: resolve
  };
}

// TODO: JK really don't want to pull all user's resources into memory
const cleanup = (userId: string) => (context: Context.t): TE.TaskEither<Exception.t, void> => {
  const deleteAll =
    (deleteById: (id: string) => TE.TaskEither<Exception.t, void>) =>
    (ids: TE.TaskEither<Exception.t, string[]>): TE.TaskEither<Exception.t, void> => {
    return pipe(
        ids
      , TE.map(A.map((id) => deleteById(id)))
      , TE.chain(A.sequence(TE.ApplicativeSeq))
      , TE.map((_) => {})
    );
  }

  const cleanupSources = () => {
    return pipe(
        SourceFrontend.all(context.pool)(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(SourceFrontend.deleteById(context.pool)(userId))
    );
  }

  const cleanupIntegrations = () => {
    return pipe(
        IntegrationFrontend.all(context.pool)(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(IntegrationFrontend.deleteById(context.pool)(userId))
    );
  }

  const cleanupAccounts = () => {
    return pipe(
        AccountChannel.all(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(AccountChannel.deleteById(userId))
    );
  }

  const cleanupTransactions = () => {
    return pipe(
        TransactionChannel.all(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(TransactionChannel.deleteById(userId))
    );
  }

  return pipe(
      cleanupSources()
    , TE.chain((_) => cleanupIntegrations())
    , TE.chain((_) => cleanupAccounts())
    , TE.chain((_) => cleanupAccounts())
    , TE.chain((_) => cleanupTransactions())
    , TE.chain((_) => UserFrontend.deleteById(context.pool)(userId))
    , TE.map((_) => {})
  );
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
