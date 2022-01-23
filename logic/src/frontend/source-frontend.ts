import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import SchedulerChannel from '../channel/scheduler-channel';
import { Channel } from '../channel/util';

import { Source } from "model";
import { Exception } from "magic";

export namespace SourceFrontend {
  export const all = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return pipe(
        SchedulerChannel.push(`/sources?userId=${userId}`)('GET')()
      , Channel.toArrayOf(Source.Channel.Response.from)
    );
  };

  export const getById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SchedulerChannel.push(`/sources/${id}?userId=${userId}`)('GET')()
      , Channel.to(Source.Channel.Response.from)
    );
  };

  export const create = (pool: Pool) => (source: Source.Internal.t): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SchedulerChannel.push(`/sources/`)('POST')(O.some(Source.Channel.Request.to(source)))
      , Channel.to(Source.Channel.Response.from)
    );
  };

  export const deleteById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        SchedulerChannel.push(`/sources/${id}?userId=${userId}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default SourceFrontend;
