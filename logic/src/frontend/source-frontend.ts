import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import SchedulerChannel from '../channel/scheduler-channel';

import { Source } from "model";
import { Channel, Exception } from "magic";

export namespace SourceFrontend {
  export const all = (userId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return pipe(
        SchedulerChannel.push(`/sources?userId=${userId}`)('GET')()
      , TE.map((response) => response.sources)
      , Channel.toArrayOf(Source.Channel.Response.from)
    );
  };

  export const getById = (userId: string) => (id: string): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SchedulerChannel.push(`/sources/${id}?userId=${userId}`)('GET')()
      , Channel.to(Source.Channel.Response.from)
    );
  };

  export const create = (source: Source.Internal.t): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SchedulerChannel.push(`/sources/`)('POST')(O.some(Source.Channel.Request.to(source)))
      , Channel.to(Source.Channel.Response.from)
    );
  };

  export const deleteById = (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        SchedulerChannel.push(`/sources/${id}?userId=${userId}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default SourceFrontend;
