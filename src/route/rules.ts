import Router from '@koa/router';

import { Rule } from '../model/rule'; // TODO: JK separate API json from internal model
import { Message } from './util';

export const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = { 'rules': [] };
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

