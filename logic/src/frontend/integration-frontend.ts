import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import SchedulerChannel from '../channel/scheduler-channel';

import { Integration } from "model";
import { Channel, Exception } from "magic";

export namespace IntegrationFrontend {
  export const all = (userId: string): TE.TaskEither<Exception.t, Integration.Internal.t[]> => {
    return pipe(
        SchedulerChannel.push(`/integrations?userId=${userId}`)('GET')()
      , TE.map((response) => response.integrations)
      , Channel.toArrayOf(Integration.Internal.Json.from)
    );
  };

  export const getById = (userId: string) => (id: string): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        SchedulerChannel.push(`/integrations/${id}?userId=${userId}`)('GET')()
      , Channel.to(Integration.Internal.Json.from)
    );
  };

  export const create = (integration: Integration.Internal.t): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        { userId: integration.userId, name: integration.name, credentials: integration.credentials }
      , Integration.Channel.Request.Create.Json.to
      , O.some
      , SchedulerChannel.push(`/integrations/`)('POST')
      , Channel.to(Integration.Internal.Json.from)
    );
  };

  export const deleteById = (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        SchedulerChannel.push(`/integrations/${id}?userId=${userId}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default IntegrationFrontend;
