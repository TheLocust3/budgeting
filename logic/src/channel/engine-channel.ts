import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";

import { Channel } from './util';

import { Exception } from "magic";

export namespace EngineChannel {
  const host = "localhost" // TODO: JK
  const port = "3001" // TODO: JK

  export const push = (uri: string) => (method: string) => (body: O.Option<any> = O.none): TE.TaskEither<Exception.t, any> => {
    return Channel.push(host)(port)(uri)(method)(body);
  }
}

export default EngineChannel;
