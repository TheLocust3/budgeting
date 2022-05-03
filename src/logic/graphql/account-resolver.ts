import Express from "express";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { UserArena } from "../user";
import * as Context from "./context";
import { Transactions } from "./transaction-resolver";
import { Rules } from "./rule-resolver";

import { Account } from "../../model";
import { Pipe } from "../../magic";
import { Exception } from "../../magic";

const resolveFor = (key: "physical" | "virtual") => (context: Context.t) => {
  switch (key) {
    case "physical":
      return UserArena.physical(context.arena);
    case "virtual":
      return UserArena.virtual(context.arena);
  }
}

const resolveChildrenFor = 
  (key: "physical" | "virtual") =>
  (source: any, args: any, context: Context.t): Promise<Account.Internal.t[]> => {
  return pipe(
      resolveFor(key)(context)
    , TE.map((context: UserArena.Account.t) => {
        return A.map((child: UserArena.Account.t) => child.account)(context.children)
      })
   , Pipe.toPromise
  );
}

export namespace Accounts {
  export const t = {
      type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'Account'
        , fields: {
              id: { type: graphql.GraphQLString }
            , name: { type: graphql.GraphQLString }
            , transactions: Transactions.Physical.t
          }
      }))
    , resolve: resolveChildrenFor("physical")
  }
}

export namespace Buckets {
  export const t = {
      type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'Bucket'
        , fields: {
              id: { type: graphql.GraphQLString }
            , name: { type: graphql.GraphQLString }
            , rules: Rules.Virtual.t
            , transactions: Transactions.Virtual.t
          }
      }))
    , resolve: resolveChildrenFor("virtual")
  }
}
