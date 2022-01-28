import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";

import { token } from '../frontend/util';

import { Channel, Exception } from "magic";

export namespace LogicChannel {
  const host = "localhost" // TODO: JK
  const port = "3001" // TODO: JK

  export const push = (uri: string) => (method: string) => (body: O.Option<any> = O.none): TE.TaskEither<Exception.t, any> => {
    return Channel.pushWithToken(host)(port)(uri)(method)(token)(body);
  }
}

export default LogicChannel;
