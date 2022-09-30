import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";
import { GraphQLJSONObject } from 'graphql-type-json';

import { UserArena } from "../../user";
import * as Context from "./context";
import * as Types from "./types";

import { Account, Template } from "../../model";
import { Pipe } from "../../magic";
import { Exception } from "../../magic";

const resolveTemplatesForAccount =
  (source: Account.Internal.t, args: any, context: Context.t): Promise<Template.Internal.t[]> => {
  return pipe(
      UserArena.templatesFor(context.pool)(context.arena)(source.id)
    , Pipe.toPromise
  );
}

export namespace Templates {
  export const t = {
      type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.Template.t))
    , resolve: resolveTemplatesForAccount
  }
}