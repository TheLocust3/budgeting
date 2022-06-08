import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as E from "fp-ts/Either";

import { Frontend, Builder } from '../ir';
import { Materialize as MaterializeModel } from "../../model";
import { Exception } from "../../magic";

export namespace ForAccount {
  export const execute = (pool: Pool) => (userId: string) => (accountId: string): TE.TaskEither<Exception.t, MaterializeModel.Internal.t> => {
    const builder: Builder.ForAccount.t = {
        userId: userId
      , accountId: accountId
      , aggregations: {}
    };

    return pipe(
        Builder.ForAccount.build(pool)(builder)
      , TE.chain(Frontend.execute(pool))
      , TE.map(({ materialized }) => materialized)
    );
  }
}