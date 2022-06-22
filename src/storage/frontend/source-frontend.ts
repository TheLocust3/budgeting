import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Source } from "../../model";
import * as SourcesTable from "../db/sources-table";
import { Exception } from "../../magic";

export namespace SourceFrontend {
  export const all = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return SourcesTable.all(pool)(userId);
  };

  export const getById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        id
      , SourcesTable.byId(pool)(userId)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Source.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (source) => TE.of(source)
        ))
    );
  };

  export const allByIntegrationId = (pool: Pool) => (userId: string) => (integrationId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return SourcesTable.byIntegrationId(pool)(userId)(integrationId);
  };

  export const allWithoutIntegrationId = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return SourcesTable.withoutIntegrationId(pool)(userId);
  };

  export const create = (pool: Pool) => (source: Source.Frontend.Create.t): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        source
      , SourcesTable.create(pool)
    );
  };

  export const deleteById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , SourcesTable.deleteById(pool)(userId)
    );
  };

  export const pull = (pool: Pool) => (): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SourcesTable.pull(pool)()
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Source.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (source) => TE.of(source)
        ))
    );
  };

  export const pullForRollup = (pool: Pool) => (): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        SourcesTable.pullForRollup(pool)()
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Source.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (source) => TE.of(source)
        ))
    );
  };
}

export default SourceFrontend;
