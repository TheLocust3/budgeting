import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import LogicChannel from '../channel/logic-channel';

import { Source } from "model";
import { Channel, Exception } from "magic";

export namespace SourceFrontend {
  export const all = (): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return pipe(
        LogicChannel.push(`/sources`)('GET')()
      , Channel.to(Source.Frontend.Response.SourceList.Json.from)
      , TE.map(({ sources }) => sources)
    );
  };

  export const getById = (id: string): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        LogicChannel.push(`/sources/${id}`)('GET')()
      , Channel.to(Source.Internal.Json.from)
    );
  };

  export const create = (source: Source.Internal.t): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        { name: source.name, integrationId: source.integrationId }
      , Source.Frontend.Request.Create.Json.to
      , O.some
      , LogicChannel.push(`/sources/`)('POST')
      , Channel.to(Source.Internal.Json.from)
    );
  };

  export const deleteById = (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        LogicChannel.push(`/sources/${id}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default SourceFrontend;
