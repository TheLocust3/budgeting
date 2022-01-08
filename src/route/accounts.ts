import Router from '@koa/router';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Account from '../model/account';
import * as AccountsTable from '../db/accounts';
import { router as rulesRouter } from './rules';
import { Message } from './util';

export const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = { 'accounts': [] };
  })
  .get('/:accountId', (ctx, next) => {
    const accountId = ctx.params.accountId
    ctx.body = { 'id': accountId };
  })
  .post('/', async (ctx, next) => {
    await pipe(
      ctx.request.body,
      Account.Json.lift,
      TE.fromEither,
      TE.chain(AccountsTable.create(ctx.db)),
      TE.map(x => {
        console.log(x)
        return x
      }),
      TE.match(
        (_) => {
          console.log('hmm2')
          ctx.status = 400
          ctx.body = Message.error("Bad request");
        },
        (account) => {
          console.log('hmm')
          ctx.body = account;
        }
      )
    )();
  })
  .delete('/:accountId', (ctx, next) => {
    ctx.body = Message.ok;
  })
  .use('/:accountId/rules', rulesRouter.routes(), rulesRouter.allowedMethods());

