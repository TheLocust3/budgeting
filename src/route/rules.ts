import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Rule from '../model/rule';
import * as RulesTable from '../db/rules';
import { Message } from './util';
import { fromQuery } from '../model/util';

export const router = new Router();

router
  .get('/', async (ctx, next) => {
    await pipe(
        ctx.query.accountId
      , fromQuery
      , TE.fromEither
      , TE.chain(RulesTable.byAccountId(ctx.db))
      , TE.map(A.map(Rule.Json.to))
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (rules) => {
            ctx.body = { rules: rules };
          }
        )
    )();
  })
  .get('/:ruleId', async (ctx, next) => {
    const ruleId = ctx.params.ruleId
    await pipe(
        RulesTable.byId(ctx.db)(ruleId)
      , TE.map(O.map(Rule.Json.to))
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
            (rule) => {
              ctx.body = { rule: rule };
            }
          )
        )
    )();
  })
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Rule.Json.from
      , TE.fromEither
      , TE.chain(RulesTable.create(ctx.db))
      , TE.map(Rule.Json.to)
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
  .delete('/:ruleId', async (ctx, next) => {
    const ruleId = ctx.params.ruleId
    await pipe(
        RulesTable.deleteById(ctx.db)(ruleId)
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
  });

