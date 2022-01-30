import Koa from "koa";
import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";

import UserFrontend from "../frontend/user-frontend";
import SourceFrontend from "../frontend/source-frontend";
import IntegrationFrontend from "../frontend/integration-frontend";
import AccountFrontend from "../frontend/account-frontend";
import TransactionFrontend from "../frontend/transaction-frontend";
import { AuthenticationFor } from "./util";

import { User } from "model";
import { Exception, Reaper, Message, Pipe, Route } from "magic";

export const router = new Router();

router
  .use(AuthenticationFor.admin)

router
  .get('/', (context) => {
    return pipe(
        UserFrontend.all(context.db)()
      , TE.map((users) => { return { users: users }; })
      , Route.respondWith(context)(User.Frontend.Response.UserList.Json)
    );
  });

router
  .get('/:userId', (context) => {
    const userId = context.params.userId

    return pipe(
        UserFrontend.getById(context.db)(userId)
      , Route.respondWith(context)(User.Internal.Json)
    );
  });

router
  .delete('/:userId', (context) => {
    // start async job
    Reaper.enqueue((id) => {
      console.log(`DeleteUser[${id}] user ${context.state.user.id}`);

      return pipe(
          cleanup(context)
        , TE.match(
              (error) => {
                console.log(`DeleteUser[${id}] failed with ${error}`)
                return false
              }
            , () => {
                console.log(`DeleteUser[${id}] complete`)
                return true;
              }
          )
      );
    });

    context.body = Message.ok;
  });

// TODO: JK really don't want to pull all user's resources into memory
const cleanup = (context: Koa.Context): TE.TaskEither<Exception.t, void> => {
  const userId = context.params.userId

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
        SourceFrontend.all(context.db)(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(SourceFrontend.deleteById(context.db)(userId))
    );
  }

  const cleanupIntegrations = () => {
    return pipe(
        IntegrationFrontend.all(context.db)(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(IntegrationFrontend.deleteById(context.db)(userId))
    );
  }

  const cleanupAccounts = () => {
    return pipe(
        AccountFrontend.all(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(AccountFrontend.deleteById(userId))
    );
  }

  const cleanupTransactions = () => {
    return pipe(
        TransactionFrontend.all(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(TransactionFrontend.deleteById(userId))
    );
  }

  return pipe(
      cleanupSources()
    , TE.chain((_) => cleanupIntegrations())
    , TE.chain((_) => cleanupAccounts())
    , TE.chain((_) => cleanupAccounts())
    , TE.chain((_) => cleanupTransactions())
    , TE.chain((_) => UserFrontend.deleteById(context.db)(userId))
    , TE.map((_) => {})
  );
}
