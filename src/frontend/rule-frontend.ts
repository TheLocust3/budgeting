import { Pool } from 'pg';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';

import * as Rule from '../model/rule';
import * as RulesTable from '../db/rules';
import { throwNotFound, throwInternalError, Exception } from '../exception';

export namespace RuleFrontend {
  export const getByAccountId = (pool: Pool) => (accountId: string): TE.TaskEither<Exception, Rule.Internal.t[]> => {
    return pipe(
        accountId
      , RulesTable.byAccountId(pool)
      , TE.mapLeft((_) => throwInternalError)
    );
  }

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception, Rule.Internal.t> => {
    return pipe(
        id
      , RulesTable.byId(pool)
      , TE.mapLeft((_) => throwInternalError)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception, Rule.Internal.t> => TE.throwError(throwNotFound)
          , (rule) => TE.of(rule)
        ))
    );
  }

  export const create = (pool: Pool) => (rule: Rule.Internal.t): TE.TaskEither<Exception, Rule.Internal.t> => {
    return pipe(
        rule
      , RulesTable.create(pool)
      , TE.mapLeft((_) => throwInternalError)
    );
  }

  export const deleteById = (pool: Pool) => (id: string): TE.TaskEither<Exception, void> => {
    return pipe(
        id
      , RulesTable.deleteById(pool)
      , TE.mapLeft((_) => throwInternalError)
    );
  }
}

export default RuleFrontend;
