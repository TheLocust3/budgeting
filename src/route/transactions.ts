import Router from '@koa/router';

import { Transaction } from '../model/transaction'; // TODO: JK separate API json from internal model
import { Message } from './util';

export const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = { 'transactions': [] };
  })
  .get('/:id', (ctx, next) => {
    const id = ctx.params.id
    ctx.body = { 'id': id };
  })
  .post('/', (ctx, next) => {
    ctx.body = Message.ok;
  })
  .delete('/', (ctx, next) => {
    ctx.body = Message.ok;
  });

