import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import LogicChannel from '../channel/logic-channel';
import { Cookie } from './util';

import { User } from "model";
import { Channel, Exception } from "magic";

export namespace UserFrontend {
  export const isAuthenticated = () =>
    O.match(() => false, (token: string) => token !== undefined && token !== null && token !== "")(Cookie.get("token"))

  export const login = (email: string, password: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        { email: email, password: password }
      , User.Frontend.Request.Credentials.Json.to
      , O.some
      , LogicChannel.push(`/users/login`)('POST')
      , Channel.to(User.Frontend.Response.Token.Json.from)
      , TE.map(({ token }) => {
          Cookie.set("token", token);
          return;
        })
    );
  };

  export const logout = (): TE.TaskEither<Exception.t, void> => {
    return TE.tryCatch(
        async () => {
          Cookie.set("token", "");
          return;
        }
      , () => Exception.throwInternalError
    )
  };

  export const create = (email: string, password: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        { email: email, password: password }
      , User.Frontend.Request.Create.Json.to
      , O.some
      , LogicChannel.push(`/users/`)('POST')
      , Channel.toVoid
    );
  };
}

export default UserFrontend;
