import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";

import { ENGINE_HOST, ENGINE_PORT } from "../constants";

import { Channel, Exception } from "magic";

export namespace EngineChannel {
  const host = ENGINE_HOST;
  const port = ENGINE_PORT;

  export const push = (uri: string) => (method: string) => (body: O.Option<any> = O.none): TE.TaskEither<Exception.t, any> => {
    return Channel.push(host)(port)(`/channel${uri}`)(method)(body);
  }
}

export default EngineChannel;
