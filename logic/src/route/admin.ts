import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as iot from "io-ts";

import UserFrontend from "../frontend/user-frontend";
import SourceFrontend from "../frontend/source-frontend";
import AccountFrontend from "../frontend/account-frontend";
import TransactionFrontend from "../frontend/transaction-frontend";
import { AuthenticationFor } from "./util";

import { User } from "model";
import { Exception, Reaper, Message, Pipe } from "magic";

export const router = new Router();

router
  .use(AuthenticationFor.admin)
  .get('/', async (ctx, next) => {
    await pipe(
        UserFrontend.all(ctx.db)()
      , TE.map(A.map(User.Json.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (users) => {
              ctx.body = { users: users };
            }
        )
    )();
  })
  .get('/:userId', async (ctx, next) => {
    const userId = ctx.params.userId
    await pipe(
        userId
      , UserFrontend.getById(ctx.db)
      , TE.map(User.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (user) => {
              ctx.body = { user: user };
            }
        )
    )();
  })
  .delete('/:userId', async (ctx, next) => {
    const userId = ctx.params.userId
    Reaper.enqueue((id) => {
      console.log(`DeleteUser[${id}] user ${userId}`);

      // TODO: JK really don't want to pull all user's resources into memory
      return pipe(
          TE.Do
        , TE.bind('sources', () => SourceFrontend.all(userId))
        , TE.chain(({ sources }) => {
            return pipe(
                sources
              , A.map((source) => source.id)
              , Pipe.flattenOption
              , A.map(SourceFrontend.deleteById(userId))
              , A.sequence(TE.ApplicativeSeq)
            );
          })
        , TE.bind('accounts', () => AccountFrontend.all(userId))
        , TE.chain(({ accounts }) => {
            return pipe(
                accounts
              , A.map((account) => account.id)
              , Pipe.flattenOption
              , A.map(AccountFrontend.deleteById(userId))
              , A.sequence(TE.ApplicativeSeq)
            );
          })
        , TE.bind('transactions', () => TransactionFrontend.all(userId))
        , TE.chain(({ transactions }) => {
            return pipe(
                transactions
              , A.map((transaction) => transaction.id)
              , Pipe.flattenOption
              , A.map(TransactionFrontend.deleteById(userId))
              , A.sequence(TE.ApplicativeSeq)
            );
          })
        , TE.chain((_) => UserFrontend.deleteById(ctx.db)(userId))
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

    console.log("TESTEST")
    ctx.body = Message.ok;
  });
