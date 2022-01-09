import Router from '@koa/router';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Transaction from '../model/transaction';
import * as TransactionsTable from '../db/transactions';
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
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Transaction.Json.lift
      , TE.fromEither
      , TE.chain(TransactionsTable.create(ctx.db))
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (account) => {
            ctx.body = account;
          }
        )
    )();
  })
  .delete('/:transactionId', (ctx, next) => {
    ctx.body = Message.ok;
  });

