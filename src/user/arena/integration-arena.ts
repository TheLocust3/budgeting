import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import * as Arena from "./index";

import { Integration, Source } from "../../model";
import { IntegrationFrontend, SourceFrontend } from "../../storage";
import { Exception } from "../../magic";

type WithSources = {
  integration: Integration.Internal.t;
  sources: Source.Internal.t[];
}

export type t = WithSources[];

export const resolve = 
  (pool: Pool) =>
  (arena: Arena.t): TE.TaskEither<Exception.t, t> => {
  const withSources = (integration: Integration.Internal.t): TE.TaskEither<Exception.t, WithSources> => {
    console.log(integration)
    return pipe(
        SourceFrontend.allByIntegrationId(pool)(arena.user.id)(integration.id)
      , TE.map((sources) => ({ integration: integration, sources: sources }))
    );
  }

  return pipe(
      IntegrationFrontend.all(pool)(arena.user.id)
    , TE.chain((integrations) => {
        return pipe(integrations, A.map(withSources), A.sequence(TE.ApplicativeSeq))
      })
  )
}
