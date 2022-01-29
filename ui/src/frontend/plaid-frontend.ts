import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { PlaidLinkOnSuccessMetadata, PlaidAccount } from "react-plaid-link";

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

  export const exchangePublicToken = (publicToken: string, metadata: PlaidLinkOnSuccessMetadata): TE.TaskEither<Exception.t, void> => {
    const accounts = A.map((account: PlaidAccount) => { return { id: account.id, name: account.name }; })(metadata.accounts);
    return pipe(
        { publicToken: publicToken, accounts: accounts }
      , Plaid.Frontend.Request.ExchangePublicToken.Json.to
      , O.some
      , LogicChannel.push(`/plaid/exchange_public_token`)('POST')
      , Channel.toVoid
    );
  };
}

export default PlaidFrontend;
