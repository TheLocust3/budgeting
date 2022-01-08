import Router from '@koa/router';

import { Rule } from '../model/rule'; // TODO: JK separate API json from internal model
import { Message } from './util';

export const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = { 'rules': [] };
  })
  .get('/:ruleId', (ctx, next) => {
    const accountId = ctx.params.accountId
    const ruleId = ctx.params.ruleId
    ctx.body = { 'id': ruleId, 'accountId': accountId };
  })
  .post('/', (ctx, next) => {
    const rule = Rule.decode(ctx.request.body);
    ctx.body = Message.ok;
  })
  .delete('/:ruleId', (ctx, next) => {
    ctx.body = Message.ok;
  });

