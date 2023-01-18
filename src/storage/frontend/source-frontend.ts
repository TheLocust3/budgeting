import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Source } from "../../model";
import * as SourcesTable from "../db/sources-table";
import { Exception } from "../../magic";

export namespace SourceFrontend {
  export const all = (pool: Pool) => (log: Logger) => (userId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return SourcesTable.all(pool)(log)(userId);
  };

  export const getById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        id
      , SourcesTable.byId(pool)(log)(userId)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Source.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (source) => TE.of(source)
        ))
    );
  };

  export const allByIntegrationId = (pool: Pool) => (log: Logger) => (userId: string) => (integrationId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return SourcesTable.byIntegrationId(pool)(log)(userId)(integrationId);
  };

  export const allWithoutIntegrationId = (pool: Pool) => (log: Logger) => (userId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return SourcesTable.withoutIntegrationId(pool)(log)(userId);
  };

  export const create = (pool: Pool) => (log: Logger) => (source: Source.Frontend.Create.t): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        source
      , SourcesTable.create(pool)(log)
    );
  };

  export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , SourcesTable.deleteById(pool)(log)(userId)
    );
  };

  export const pull = (pool: Pool) => (log: Logger) => (): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SourcesTable.pull(pool)(log)()
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Source.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (source) => TE.of(source)
        ))
    );
  };

  export const pullForRollup = (pool: Pool) => (log: Logger) => (): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SourcesTable.pullForRollup(pool)(log)()
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Source.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (source) => TE.of(source)
        ))
    );
  };
}

export default SourceFrontend;
