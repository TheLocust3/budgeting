import React, { useCallback, useState } from "react";
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess } from "react-plaid-link";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import PlaidFrontend from "../frontend/plaid-frontend";

interface Props {
  token: string;
}

const PlaidLink = ({ token }: Props) => {
  const onSuccess = useCallback<PlaidLinkOnSuccess>(
      async (publicToken, metadata) => {
        console.log(publicToken);
        console.log(metadata); // TODO: JK will want to use this to drive sources/account creation

        await pipe(
            PlaidFrontend.exchangePublicToken(publicToken)
          , TE.match(
                (error) => {
                  console.log("Failed to exchange public token");
                  console.log(error);
                }
              , (out) => console.log(out)
            )
        )();
      }
    , []
  );

  const config: PlaidLinkOptions = { token, onSuccess };
  const { open, ready } = usePlaidLink(config);

  return (
    <button onClick={() => open()} disabled={!ready}>
      Connect a bank account
    </button>
  );
};

const Linker = () => {
  const [token, setToken] = useState<string | null>(null);

  React.useEffect(() => {
    async function createLinkToken() {
      await pipe(
          PlaidFrontend.createLinkToken()
        , TE.match(
              (error) => {
                console.log("Failed to create link token");
                console.log(error);
              }
            , (token) => setToken(token)
          )
      )();
    }
    createLinkToken();
  }, []);

  return token === null ? (
    <div>Loading...</div>
  ) : (
    <PlaidLink token={token} />
  );
};

export default Linker;