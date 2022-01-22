import Router from '@koa/router';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import SourceFrontend from '../frontend/source-frontend';

import { Source } from 'model';
import { Message } from 'magic';

export const router = new Router();

router
  .get('/', async (ctx, next) => {
    await pipe(
        SourceFrontend.all(ctx.db)("test") // TODO: JK
      , TE.map(A.map(Source.Json.to))
      , TE.match(
            Message.respondWithError(ctx)
          , (sources) => {
              ctx.body = { sources: sources };
            }
        )
    )();
  })
  .get('/:sourceId', async (ctx, next) => {
    const sourceId = ctx.params.sourceId
    await pipe(
        sourceId
      , SourceFrontend.getById(ctx.db)
      , TE.map(Source.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (source) => {
              ctx.body = { source: source };
            }
        )
    )();
  })
  .post('/', async (ctx, next) => {
    await pipe(
        ctx.request.body
      , Source.Json.from
      , TE.fromEither
      , TE.chain(SourceFrontend.create(ctx.db))
      , TE.map(Source.Json.to)
      , TE.match(
            Message.respondWithError(ctx)
          , (source) => {
              ctx.body = source;
            }
        )
    )();
  })
  .delete('/:sourceId', async (ctx, next) => {
    const sourceId = ctx.params.sourceId;
    await pipe(
        sourceId
      , SourceFrontend.deleteById(ctx.db)
      , TE.match(
            Message.respondWithError(ctx)
          , (_) => {
              ctx.body = Message.ok;
            }
        )
    )();
  })
