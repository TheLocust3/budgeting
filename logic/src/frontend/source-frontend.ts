import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import { Source } from 'model';
import * as SourcesTable from '../db/sources-table';
import { Exception } from 'magic';

export namespace SourceFrontend {
  export const all = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    return pipe(
        SourcesTable.all(pool)(userId)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        id
      , SourcesTable.byId(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Source.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (source) => TE.of(source)
        ))
    );
  }

  export const create = (pool: Pool) => (source: Source.Internal.t): TE.TaskEither<Exception.t, Source.Internal.t> => {
    return pipe(
        source
      , SourcesTable.create(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }

  export const deleteById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , SourcesTable.deleteById(pool)
      , TE.mapLeft((_) => Exception.throwInternalError)
    );
  }
}

export default SourceFrontend;
