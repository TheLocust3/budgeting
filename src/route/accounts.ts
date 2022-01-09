import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Account from '../model/account';
import * as AccountsTable from '../db/accounts';
import { Message } from './util';
import { fromQuery } from '../model/util';

export const router = new Router();

router
  .get('/', async (ctx, next) => {
    await pipe(
        ctx.query.groupId
      , fromQuery
      , TE.fromEither
      , TE.chain(AccountsTable.byGroupId(ctx.db))
      , TE.map(A.map(Account.Json.to))
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (accounts) => {
            ctx.body = { accounts: accounts };
          }
        )
    )();
  })
  .get('/:accountId', async (ctx, next) => {
    const accountId = ctx.params.accountId
    await pipe(
        AccountsTable.byId(ctx.db)(accountId)
      , TE.map(O.map(Account.Json.to))
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          O.match(
            () => {
              ctx.status = 404
              ctx.body = Message.error("Not found");
            },
            (account) => {
              ctx.body = { account: account };
            }
          )
        )
    )();
  })
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Account.Json.from
      , TE.fromEither
      , TE.chain(AccountsTable.create(ctx.db))
      , TE.map(Account.Json.to)
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (account) => {
            ctx.body = account;
          }
        )
    )();
  })
  .delete('/:accountId', async (ctx, next) => {
    const accountId = ctx.params.accountId
    await pipe(
        AccountsTable.deleteById(ctx.db)(accountId)
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (_) => {
            ctx.body = Message.ok;
          }
        )
    )();
  })
