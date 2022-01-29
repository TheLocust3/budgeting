import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Integration } from "model";
import * as IntegrationTable from "../db/integrations-table";
import { Exception } from "magic";

export namespace IntegrationFrontend {
  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        id
      , IntegrationTable.byId(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Integration.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (integration) => TE.of(integration)
        ))
    );
  };
}

export default IntegrationFrontend;
