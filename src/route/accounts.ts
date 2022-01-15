import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import AccountFrontend from '../frontend/account-frontend';

import * as Account from '../model/account';
import * as Transaction from '../model/transaction';
import * as Rule from '../model/rule';
import * as AccountsTable from '../db/accounts';
import * as RulesTable from '../db/rules';
import { materialize } from '../materialize/index';
import { Message } from './util';
import { fromQuery } from '../model/util';

export const router = new Router();

router
  .get('/', async (ctx, next) => {
    await pipe(
        AccountFrontend.all(ctx.db)()
      , TE.map(A.map(Account.Json.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (accounts) => {
              ctx.body = { accounts: accounts };
            }
        )
    )();
  })
  .get('/:accountId', async (ctx, next) => {
    const accountId = ctx.params.accountId
    await pipe(
        accountId
      , AccountFrontend.getById(ctx.db)
      , TE.map(Account.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (account) => {
              ctx.body = { account: account };
            }
        )
    )();
  })
  .get('/:accountId/materialize', async (ctx, next) => {
    const accountId = ctx.params.accountId
    await pipe(
        AccountsTable.byId(ctx.db)(accountId)
      , TE.chain(O.match(
            () => TE.right(O.none)
          , (account) => pipe(
                accountId
              , RulesTable.byAccountId(ctx.db)
              , TE.map((rules) => { return O.some({ ...account, rules: rules }); })
            )
        ))
      , TE.chain(O.match(
            () => TE.right(O.none)
          , (account) => pipe(
              account
            , materialize(ctx.db)
            , TE.map(({ transactions, conflicts }) => { // TODO: JK move this into some other place
                return {
                    transactions: pipe(transactions, A.map(Transaction.Materialize.to), A.map(Transaction.Json.to))
                  , conflicts: A.map(({ transaction, rules }: { transaction: Transaction.Materialize.t, rules: Rule.Internal.Update[] }) => {
                      return {
                          transaction: pipe(transaction, Transaction.Materialize.to, Transaction.Json.to)
                        , rules: rules
                      };
                    })(conflicts)
                };
              })
            , TE.map(O.some)
          )
        ))
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
            (transactions) => {
              ctx.body = transactions;
            }
          )
        )
    )();
  })
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Account.Json.from
      , TE.fromEither
      , TE.chain(AccountFrontend.create(ctx.db))
      , TE.map(Account.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (account) => {
              ctx.body = account;
            }
        )
    )();
  })
  .delete('/:accountId', async (ctx, next) => {
    const accountId = ctx.params.accountId
    await pipe(
        accountId
      , AccountFrontend.deleteById(ctx.db)
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  })
