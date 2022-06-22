import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Integration } from "../../model";
import * as IntegrationTable from "../db/integrations-table";
import { Exception } from "../../magic";

export namespace IntegrationFrontend {
  export const all = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Integration.Internal.t[]> => {
    return IntegrationTable.all(pool)(userId);
  };

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        id
      , IntegrationTable.byId(pool)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Integration.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (integration) => TE.of(integration)
        ))
    );
  };

  export const getByIdAndUserId = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        getById(pool)(id)
      , TE.chain((integration) => {
          if (integration.userId == userId) {
            return TE.of(integration);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const create = (pool: Pool) => (integration: Integration.Frontend.Create.t): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    return pipe(
        integration
      , IntegrationTable.create(pool)
    );
  };

  export const deleteById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , IntegrationTable.deleteById(pool)(userId)
    );
  };
}

export default IntegrationFrontend;
