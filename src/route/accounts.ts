import Router from '@koa/router';
import { Either, fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Account from '../model/account';
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
  .post('/', (ctx, next) => {
    pipe(
      ctx.request.body,
      Account.Json.lift,
      fold(
        (_) => {
          ctx.status = 400
          ctx.body = Message.error("Bad request");
        },
        (_) => {
          ctx.body = Message.ok;
        }
      )
    );
  })
  .delete('/:accountId', (ctx, next) => {
    ctx.body = Message.ok;
  })
  .use('/:accountId/rules', rulesRouter.routes(), rulesRouter.allowedMethods());

