import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";

import { SCHEDULER_HOST, SCHEDULER_PORT } from "../constants";

import { Channel, Exception } from "../../magic";

export namespace SchedulerChannel {
  const host = SCHEDULER_HOST;
  const port = SCHEDULER_PORT;

  export const push = (uri: string) => (method: string) => (body: O.Option<any> = O.none): TE.TaskEither<Exception.t, any> => {
    return Channel.push(host)(port)(`/channel${uri}`)(method)(body);
  }
}

export default SchedulerChannel;
