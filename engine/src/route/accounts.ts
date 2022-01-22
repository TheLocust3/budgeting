import Router from "@koa/router";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import AccountFrontend from "../frontend/account-frontend";

import { Account } from "model";
import { Transaction } from "model";
import { Rule } from "model";
import * as Materialize from "../materialize/index";
import { Message } from "magic";

export const router = new Router();

router
  .get("/", async (ctx, next) => {
    await pipe(
        AccountFrontend.all(ctx.db)()
      , TE.map(A.map(Account.Json.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (accounts) => {
              ctx.body = { accounts: accounts };
            }
        )
    )();
  })
  .get("/:accountId", async (ctx, next) => {
    const accountId = ctx.params.accountId;
    await pipe(
        accountId
      , AccountFrontend.getById(ctx.db)
      , TE.map(Account.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (account) => {
              ctx.body = { account: account };
            }
        )
    )();
  })
  .get("/:accountId/materialize", async (ctx, next) => {
    const accountId = ctx.params.accountId;
    await pipe(
        accountId
      , AccountFrontend.getById(ctx.db)
      , TE.chain(AccountFrontend.withRules(ctx.db))
      , TE.chain(AccountFrontend.withChildren(ctx.db))
      , TE.chain((account) => pipe(
            account
          , Materialize.execute(ctx.state.id)(ctx.db)
          , TE.map(Materialize.Json.to)
        ))
      , TE.match(
            Message.respondWithError(ctx)
          , (transactions) => {
              ctx.body = transactions;
            }
        )
    )();
  })
  .post("/", async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Account.Json.from
      , TE.fromEither
      , TE.chain(AccountFrontend.create(ctx.db))
      , TE.map(Account.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (account) => {
              ctx.body = account;
            }
        )
    )();
  })
  .delete("/:accountId", async (ctx, next) => {
    const accountId = ctx.params.accountId;
    await pipe(
        accountId
      , AccountFrontend.deleteById(ctx.db)
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  });
