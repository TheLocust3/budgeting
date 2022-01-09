import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Transaction from '../model/transaction';
import * as TransactionsTable from '../db/transactions';
import { Message } from './util';

export const router = new Router();

router
  .get('/', async (ctx, next) => {
    await pipe(
        TransactionsTable.all(ctx.db)()
      , TE.map(A.map(Transaction.Internal.t.encode))
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (transactions) => {
            ctx.body = { transactions: transactions };
          }
        )
    )();
  })
  .get('/:transactionId', async (ctx, next) => {
    const transactionId = ctx.params.transactionId
    await pipe(
        TransactionsTable.byId(ctx.db)(transactionId)
      , TE.map(O.map(Transaction.Internal.t.encode))
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
            (transaction) => {
              ctx.body = { transaction: transaction };
            }
          )
        )
    )();
  })
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Transaction.Json.lift
      , TE.fromEither
      , TE.chain(TransactionsTable.create(ctx.db))
      , TE.map(Transaction.Internal.t.encode)
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (transaction) => {
            ctx.body = transaction;
          }
        )
    )();
  })
  .delete('/:transactionId', (ctx, next) => {
    ctx.body = Message.ok;
  });

