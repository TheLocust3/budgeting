import Router from '@koa/router';

import { Transaction } from '../model/transaction'; // TODO: JK separate API json from internal model
import { Message } from './util';

export const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = { 'transactions': [] };
  })
  .get('/:transactionId', (ctx, next) => {
    const transactionId = ctx.params.transactionId
    ctx.body = { 'id': transactionId };
  })
  .post('/', (ctx, next) => {
    const transaction = Transaction.decode(ctx.request.body);
    ctx.body = Message.ok;
  })
  .delete('/:transactionId', (ctx, next) => {
    ctx.body = Message.ok;
  });

