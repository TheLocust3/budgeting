import Router from '@koa/router';
import { Either, fold } from 'fp-ts/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Transaction from '../model/transaction'; // TODO: JK separate API json from internal model
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
    pipe(
      ctx.request.body,
      Transaction.Json.lift,
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
  .delete('/:transactionId', (ctx, next) => {
    ctx.body = Message.ok;
  });

