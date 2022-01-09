import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Rule from '../model/rule';
import * as RulesTable from '../db/rules';
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
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Rule.Json.lift
      , TE.fromEither
      , TE.chain(RulesTable.create(ctx.db))
      , TE.map(Rule.Internal.t.encode)
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (rule) => {
            ctx.body = rule;
          }
        )
    )();
  })
  .delete('/:ruleId', (ctx, next) => {
    ctx.body = Message.ok;
  });

