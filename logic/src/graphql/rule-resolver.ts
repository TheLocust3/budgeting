import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";
import { GraphQLJSONObject } from 'graphql-type-json';

import * as Context from "./context";
import { toPromise } from "./util";

import { Rule } from "model";
import { Exception } from "magic";

const resolve = (source: any, args: any, context: Context.t): Promise<Rule.Internal.t[]> => {
  return pipe(
      Context.virtualRules(context)
    , toPromise
  );
}

export namespace Rules {
  export const t = new graphql.GraphQLList(new graphql.GraphQLObjectType({
      name: 'Rule'
    , fields: {
          id: { type: graphql.GraphQLString }
        , rule: { type: GraphQLJSONObject }
      }
  }))

  const Rule = t; // alias
  export namespace Virtual {
    export const t = {
        type: Rule
      , resolve: resolve
    }
  }
}