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

import { Rule } from "../../model";
import { Exception, Pipe } from "../../magic";

const resolve = (source: any, args: any, context: Context.t): Promise<Rule.Internal.t[]> => {
  return pipe(
      UserArena.virtualRules(context.arena)
    , Pipe.toPromise
  );
}

export namespace Rules {
  export namespace Virtual {
    export const t = {
        type: new graphql.GraphQLList(Types.Rule.t)
      , resolve: resolve
    }
  }
}