import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { Template } from "../../model";
import * as TemplatesTable from "../db/templates-table";
import { Exception } from "../../magic";

export namespace TemplateFrontend {
  export const all = (pool: Pool) => (userId: string): TE.TaskEither<Exception.t, Template.Internal.t[]> => {
    return TemplatesTable.all(pool)(userId);
  };

  export const getByAccountId = (pool: Pool) => (userId: string) => (accountId: string): TE.TaskEither<Exception.t, Template.Internal.t[]> => {
    return TemplatesTable.byAccountId(pool)(userId)(accountId);
  };

  export const getById = (pool: Pool) => (id: string): TE.TaskEither<Exception.t, Template.Internal.t> => {
    return pipe(
        id
      , TemplatesTable.byId(pool)
      , TE.chain(O.fold(
            (): TE.TaskEither<Exception.t, Template.Internal.t> => TE.throwError(Exception.throwNotFound)
          , (template) => TE.of(template)
        ))
    );
  };

  export const getByIdAndUserId = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, Template.Internal.t> => {
    return pipe(
        id
      , getById(pool)
      , TE.chain((template) => {
          if (template.userId == userId) {
            return TE.of(template);
          } else {
            return TE.throwError(Exception.throwNotFound);
          }
        })
    );
  };

  export const create = (pool: Pool) => (template: Template.Frontend.Create.t): TE.TaskEither<Exception.t, Template.Internal.t> => {
    return pipe(
        template
      , TemplatesTable.create(pool)
    );
  };

  export const deleteById = (pool: Pool) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , TemplatesTable.deleteById(pool)(userId)
    );
  };
}

export default TemplateFrontend;
