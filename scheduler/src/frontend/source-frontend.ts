import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import IntegrationFrontend from "./integration-frontend";
import * as SourcesTable from "../db/sources-table";

import { Source } from "model";
import { Exception } from "magic";

export namespace SourceFrontend {
  export const allExpired = (pool: Pool) => (): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return pipe(
        SourcesTable.allExpired(pool)()
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  };

  export const tryLockById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, boolean> => {
    return pipe(
        id
      , SourcesTable.tryLockById(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  };
}

export default SourceFrontend;
