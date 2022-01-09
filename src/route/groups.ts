import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import { PathReporter } from 'io-ts/PathReporter';

import * as Group from '../model/group';
import * as GroupsTable from '../db/groups';
import { Message } from './util';
import { router as accountsRouter } from './accounts';

export const router = new Router();

router
  .get('/', async (ctx, next) => {
    await pipe(
        GroupsTable.all(ctx.db)()
      , TE.map(A.map(Group.Internal.t.encode))
      , TE.match(
          (_) => {
            ctx.status = 400
            ctx.body = Message.error("Bad request");
          },
          (groups) => {
            ctx.body = { groups: groups };
          }
        )
    )();
  })
  .get('/:groupId', async (ctx, next) => {
    const groupId = ctx.params.groupId
    await pipe(
        GroupsTable.byId(ctx.db)(groupId)
      , TE.map(O.map(Group.Internal.t.encode))
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
            (group) => {
              ctx.body = { group: group };
            }
          )
        )
    )();
  })
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Group.Json.lift
      , TE.fromEither
      , TE.chain(GroupsTable.create(ctx.db))
      , TE.map(Group.Internal.t.encode)
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
  .delete('/:groupId', (ctx, next) => {
    ctx.body = Message.ok;
  })
  .use('/:groupId/accounts', accountsRouter.routes(), accountsRouter.allowedMethods());

