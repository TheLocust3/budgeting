import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Template } from "../../model";
import * as TemplatesTable from "../db/templates-table";
import { Exception } from "../../magic";

export namespace TemplateFrontend {
  export const all = (pool: Pool) => (log: Logger) => (userId: string): TE.TaskEither<Exception.t, Template.Internal.t[]> => {
    return TemplatesTable.all(pool)(log)(userId);
  };

  export const getByAccountId = (pool: Pool) => (log: Logger) => (userId: string) => (accountId: string): TE.TaskEither<Exception.t, Template.Internal.t[]> => {
    return TemplatesTable.byAccountId(pool)(log)(userId)(accountId);
  };

  export const getById = (pool: Pool) => (log: Logger) => (id: string): TE.TaskEither<Exception.t, Template.Internal.t> => {
    return pipe(
        id
      , TemplatesTable.byId(pool)(log)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Template.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (template) => TE.of(template)
        ))
    );
  };

  export const getByIdAndUserId = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Template.Internal.t> => {
    return pipe(
        id
      , getById(pool)(log)
      , TE.chain((template) => {
          if (template.userId == userId) {
            return TE.of(template);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const create = (pool: Pool) => (log: Logger) => (template: Template.Frontend.Create.t): TE.TaskEither<Exception.t, Template.Internal.t> => {
    return pipe(
        template
      , TemplatesTable.create(pool)(log)
    );
  };

  export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , TemplatesTable.deleteById(pool)(log)(userId)
    );
  };
}

export default TemplateFrontend;
