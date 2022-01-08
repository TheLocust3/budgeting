import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import { Pool } from 'pg';

import { router as transactionsRouter } from './route/transactions';
import { router as accountsRouter } from './route/accounts';

type State = {}

type Context = {
  db: Pool;
}

const app = new Koa<State, Context>();
app.context.db = new Pool();

const router = new Router();

router.use('/transactions', transactionsRouter.routes(), transactionsRouter.allowedMethods());
router.use('/accounts', accountsRouter.routes(), accountsRouter.allowedMethods());

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log("Listening at localhost:3000");
