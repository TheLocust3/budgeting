import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import SchedulerChannel from '../channel/scheduler-channel';

import { Source } from "model";
import { Exception } from "magic";

export namespace SourceFrontend {
  export const all = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return pipe(
        SchedulerChannel.push(`/sources?userId=${userId}`)('GET')()
      , TE.chain((response: any) => TE.fromEither(pipe(
            response.sources
          , A.map(Source.Channel.Response.from)
          , A.sequence(E.Applicative)
        )))
    );
  };

  export const getById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SchedulerChannel.push(`/sources/${id}?userId=${userId}`)('GET')()
      , TE.chain((response: any) => pipe(response, Source.Channel.Response.from, TE.fromEither))
    );
  };

  export const create = (pool: Pool) => (source: Source.Internal.t): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SchedulerChannel.push(`/sources/`)('POST')(O.some(Source.Channel.Request.to(source)))
      , TE.chain((response: any) => pipe(response, Source.Channel.Response.from, TE.fromEither))
    );
  };

  export const deleteById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        SchedulerChannel.push(`/sources/${id}?userId=${userId}`)('DELETE')()
      , TE.map((_) => { return; })
    );
  };
}

export default SourceFrontend;
