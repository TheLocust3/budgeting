import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import { router as userRouter } from './route/users';
import { router as sourceRouter } from './route/sources';
import { JWT } from './route/util';

import { User } from 'model';
import { Message } from 'magic';

type State = {
  user: User.Internal.t;
}

type Context = {
  db: Pool;
}

const app = new Koa<State, Context>();
app.context.db = new Pool();

const router = new Router();

router.use('/users', userRouter.routes(), userRouter.allowedMethods());

/*app.use((ctx, next) => {
  return pipe(
      ctx.get('Authorization')
    , JWT.verify(ctx.db)
    , TE.match(
        Message.respondWithError(ctx)
      , async (user) => {
          ctx.state.user = user;
          await next();
        }
    )
  );
});*/
router.use('/sources', sourceRouter.routes(), sourceRouter.allowedMethods());

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3001);
console.log("Listening at localhost:3001");
