import React, { useCallback, useState } from "react";
import { usePlaidLink, PlaidLinkOptions, PlaidLinkOnSuccess } from "react-plaid-link";

interface Props {
  token: string;
}

const PlaidLink = ({ token }: Props) => {
  const onSuccess = useCallback<PlaidLinkOnSuccess>(
      async (publicToken, metadata) => {
        console.log(publicToken);
        console.log(metadata);

        let response = await fetch(
            "http://localhost:3001/plaid/exchange_public_token"
          , { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicToken: publicToken }) }
        );
        const out = await response.json();
        console.log(out);
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
      // TODO: JK need to model all of this
      let response = await fetch("http://localhost:3001/plaid/create_link_token", { method: "POST" });
      const { token } = await response.json();
      setToken(token);
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