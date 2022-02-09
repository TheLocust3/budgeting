import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";

import { AccountChannel, TransactionChannel } from "../channel";
import { AuthenticationFor } from "./util";

import { User } from "model";
import { UserFrontend, IntegrationFrontend, SourceFrontend } from "storage";
import { Exception, Reaper, Message, Pipe, Route } from "magic";

export const router = new Route.Router();

router
  .use(AuthenticationFor.admin)

router
  .get('/', (context) => {
    return pipe(
        UserFrontend.all(context.request.app.locals.db)()
      , TE.map((users) => { return { users: users }; })
      , Route.respondWith(context)(User.Frontend.Response.UserList.Json)
    );
  });

router
  .get('/:userId', (context) => {
    const userId = context.request.params.userId

    return pipe(
        UserFrontend.getById(context.request.app.locals.db)(userId)
      , Route.respondWith(context)(User.Internal.Json)
    );
  });

router
  .delete('/:userId', async (context) => {
    // start async job
    Reaper.enqueue((id) => {
      console.log(`DeleteUser[${id}] user ${context.response.locals.user.id}`);

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

    context.response.json(Message.ok);
  });

// TODO: JK really don't want to pull all user's resources into memory
const cleanup = (context: Route.Context): TE.TaskEither<Exception.t, void> => {
  const userId = context.request.params.userId

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
        SourceFrontend.all(context.request.app.locals.db)(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(SourceFrontend.deleteById(context.request.app.locals.db)(userId))
    );
  }

  const cleanupIntegrations = () => {
    return pipe(
        IntegrationFrontend.all(context.request.app.locals.db)(userId)
      , TE.map(A.map((source) => source.id))
      , deleteAll(IntegrationFrontend.deleteById(context.request.app.locals.db)(userId))
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
    , TE.chain((_) => UserFrontend.deleteById(context.request.app.locals.db)(userId))
    , TE.map((_) => {})
  );
}
