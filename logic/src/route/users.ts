import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import UserFrontend from '../frontend/user-frontend';

import { User } from 'model';
import { Message } from 'magic';

export const router = new Router();

router
  .get('/', async (ctx, next) => {
    await pipe(
        UserFrontend.all(ctx.db)()
      , TE.map(A.map(User.Json.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (users) => {
              ctx.body = { users: users };
            }
        )
    )();
  })
  .get('/:userId', async (ctx, next) => {
    const userId = ctx.params.userId
    await pipe(
        userId
      , UserFrontend.getById(ctx.db)
      , TE.map(User.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (user) => {
              ctx.body = { user: user };
            }
        )
    )();
  })
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , User.Json.from
      , TE.fromEither
      , TE.chain(UserFrontend.create(ctx.db))
      , TE.map(User.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (user) => {
              ctx.body = user;
            }
        )
    )();
  })
  .delete('/:userId', async (ctx, next) => {
    const userId = ctx.params.userId
    await pipe(
        userId
      , UserFrontend.deleteById(ctx.db)
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  })
