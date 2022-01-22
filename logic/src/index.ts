import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

import { router as authRouter } from './route/auth';
import { router as userRouter } from './route/users';
import { router as sourceRouter } from './route/sources';

type State = {}

type Context = {
  db: Pool;
}

const app = new Koa<State, Context>();
app.context.db = new Pool();

const router = new Router();

router.use('/auth', authRouter.routes(), authRouter.allowedMethods());

app.use(async (ctx, next) => {
  // TODO: JK
  await next();
});

router.use('/users', userRouter.routes(), userRouter.allowedMethods());
router.use('/sources', sourceRouter.routes(), sourceRouter.allowedMethods());

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3001);
console.log("Listening at localhost:3001");
