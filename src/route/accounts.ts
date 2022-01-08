import Router from '@koa/router';

import { Account } from '../model/account'; // TODO: JK separate API json from internal model
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
    const account = Account.decode(ctx.request.body);
    console.log(ctx.request.body)
    console.log(account)
    ctx.body = Message.ok;
  })
  .delete('/:accountId', (ctx, next) => {
    ctx.body = Message.ok;
  })
  .use('/:accountId/rules', rulesRouter.routes(), rulesRouter.allowedMethods());

