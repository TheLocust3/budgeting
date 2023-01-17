import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as Context from './context';
import * as Types from './types';

import { UserArena } from "../../user";

import { Exception, Pipe } from "../../magic";

const resolve = (source: any, args: any, context: Context.t): Promise<Types.Integration.t[]> => {
  context.log.info("IntegrationResolver.resolve")
  return pipe(
      UserArena.integrations(context.pool)(context.arena)
    , TE.map(A.map(({ integration, sources }) => ({ ...integration, sources: sources })))
    , Pipe.toPromise
  );
}

export const t = {
    type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.Integration.t))
  , resolve: resolve
}
