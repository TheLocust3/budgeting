import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Passthrough } from "./passthrough";
import { rootPath, hash } from "./util";

import { Integration } from "model";
import { Exception } from "magic";

/*namespace IntegrationEntry {
  namespace Storage {
    const Integration = iot.type({
        name: iot.string
      , credentials: Integration.Internal.PlaidCredentials
    });

    const t = iot.type({
      integrations: iot.array(t)
    });
  }

  const path = (userId: string) => `${rootPath}/users/${userId}/integrations.json`;

  export const all = (passthrough: Passthrough) => (userId: string) : TE.TaskEither<Exception.t, Integration.Internal.t[]> => {
    return pipe(
        path(email)
      , passthrough.getObject(User.Internal.Json)
    );
  }
}

export default IntegrationEntry;*/
