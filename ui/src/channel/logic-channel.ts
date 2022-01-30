import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Cookie, token } from '../frontend/util';

import { Channel, Exception } from "magic";

export namespace LogicChannel {
  const host = "localhost" // TODO: JK
  const port = "3001" // TODO: JK

  export const push = (uri: string) => (method: string) => (body: O.Option<any> = O.none): TE.TaskEither<Exception.t, any> => {
    return pipe(
        Channel.pushWithToken(host)(port)(uri)(method)(token)(body)
      , TE.mapLeft((error) => {
          if (error._type === "Unauthorized") {
            Cookie.set("token", "");
            window.location.reload();
          }

          return error;
        })
    );
  }
}

export default LogicChannel;
