import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Integration } from "../../model";
import * as IntegrationTable from "../db/integrations-table";
import { Exception } from "../../magic";

export namespace IntegrationFrontend {
  export const all = (pool: Pool) => (log: Logger) => (userId: string): TE.TaskEither<Exception.t, Integration.Internal.t[]> => {
    return IntegrationTable.all(pool)(log)(userId);
  };

  export const getById = (pool: Pool) => (log: Logger) => (id: string): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        id
      , IntegrationTable.byId(pool)(log)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Integration.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (integration) => TE.of(integration)
        ))
    );
  };

  export const getByIdAndUserId = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        getById(pool)(log)(id)
      , TE.chain((integration) => {
          if (integration.userId == userId) {
            return TE.of(integration);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const create = (pool: Pool) => (log: Logger) => (integration: Integration.Frontend.Create.t): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        integration
      , IntegrationTable.create(pool)(log)
    );
  };

  export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , IntegrationTable.deleteById(pool)(log)(userId)
    );
  };
}

export default IntegrationFrontend;
