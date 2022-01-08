import Router from '@koa/router';
import { Either, fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Rule from '../model/rule';
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
    pipe(
      ctx.request.body,
      Rule.Json.lift,
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
  .delete('/:ruleId', (ctx, next) => {
    ctx.body = Message.ok;
  });

