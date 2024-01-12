import Express from "express";
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
import { Transactions } from "./transaction-resolver";
import { Templates } from "./template-resolver";
import { Rules } from "./rule-resolver";

import { Account } from "../../model";
import { Pipe } from "../../magic";
import { Exception } from "../../magic";

const resolveFor = (key: "physical" | "virtual") => (context: Context.t) => {
  switch (key) {
    case "physical":
      return UserArena.physical(context.pool)(context.log)(context.arena);
    case "virtual":
      return UserArena.virtual(context.pool)(context.log)(context.arena);
  }
}

const resolveChildrenFor = 
  (key: "physical" | "virtual") =>
  (source: any, args: any, context: Context.t): Promise<Account.Internal.t[]> => {
  context.log.info(`AccountResolver.resolveChildrenFor - ${key}`)
  return pipe(
      resolveFor(key)(context)
    , TE.map((accountContext: UserArena.Account.t) => {
        return A.map((child: UserArena.Account.t) => child.account)(accountContext.children)
      })
   , Pipe.toPromise
  );
}

export namespace Accounts {
  export const t = {
      type: new graphql.GraphQLNonNull(new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'Account'
        , fields: {
              id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
            , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
            , transactions: Transactions.Physical.t
            , total: Transactions.PhysicalTotal.t
            , templates: Templates.t
            , metadata: { type: new graphql.GraphQLNonNull(GraphQLJSONObject) }
          }
      })))
    , resolve: resolveChildrenFor("physical")
  }
}

export namespace Buckets {
  export const t = {
      type: new graphql.GraphQLNonNull(new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'Bucket'
        , fields: {
              id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
            , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
            , transactions: Transactions.Virtual.t
            , total: Transactions.VirtualTotal.t
          }
      })))
    , resolve: resolveChildrenFor("virtual")
  }
}
