import Express from "express";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { Transactions } from "./transaction-resolver";
import * as Context from "./context";
import { toPromise } from "./util";
import AccountChannel from "../channel/account-channel";
import { PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../constants";

import { Account } from "model";
import { Exception } from "magic";

const resolveFor = (key: "physical" | "virtual") => (context: Context.t) => {
  switch (key) {
    case "physical":
      return Context.resolvePhysical(context);
    case "virtual":
      return Context.resolveVirtual(context);
  }
}

const resolveChildrenFor = 
  (key: "physical" | "virtual") =>
  (source: any, args: any, context: Context.t): Promise<Account.Internal.t[]> => {
  return pipe(
      resolveFor(key)(context)
    , TE.map((context: Context.AccountContext.t) => {
        return A.map((child: Context.AccountContext.t) => child.account)(context.children)
      })
   , toPromise
  );
}

export namespace Accounts {
  export const t = {
      type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'Account'
        , fields: {
              id: { type: graphql.GraphQLString }
            , name: { type: graphql.GraphQLString }
            , transactions: Transactions.t
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
            , transactions: Transactions.t
          }
      }))
    , resolve: resolveChildrenFor("virtual")
  }
}
