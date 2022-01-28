import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import LogicChannel from '../channel/logic-channel';

import { Plaid } from "model";
import { Channel, Exception } from "magic";

export namespace PlaidFrontend {
  export const createLinkToken = (): TE.TaskEither<Exception.t, string> => {
    return pipe(
        LogicChannel.push(`/plaid/create_link_token`)('POST')(O.none)
      , Channel.to(Plaid.Frontend.Response.CreateLinkToken.Json.from)
      , TE.map((response) => response.token)
    );
  };

  export const exchangePublicToken = (publicToken: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        { publicToken: publicToken }
      , Plaid.Frontend.Request.ExchangePublicToken.Json.to
      , O.some
      , LogicChannel.push(`/plaid/exchange_public_token`)('POST')
      , Channel.toVoid
    );
  };
}

export default PlaidFrontend;
