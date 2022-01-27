import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import LogicChannel from '../channel/logic-channel';

import { User } from "model";
import { Channel, Exception } from "magic";

export namespace SourceFrontend {
  export const login = (email: string, password: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        LogicChannel.push(`/login`)('POST')()
      , Channel.to(User.Frontend.Response.Token.Json.from)
      , TE.map(({ token }) => {
          console.log(token); // TODO: JK
          return;
        })
    );
  };

  export const logout = (): TE.TaskEither<Exception.t, void> => {
    return TE.tryCatch(
        async () => { return; } // TODO: JK
      , () => Exception.throwInternalError
    )
  };

  export const create = (email: string, password: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        { email: email, password: password }
      , User.Frontend.Request.Create.Json.to
      , O.some
      , LogicChannel.push(`/sources/`)('POST')
      , Channel.toVoid
    );
  };
}

export default SourceFrontend;
