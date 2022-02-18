import Express from "express";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as Context from "./context";
import { toPromise } from "./util";
import AccountChannel from "../channel/account-channel";
import { VIRTUAL_ACCOUNT } from "../constants";

import { Account, Transaction, Materialize } from "model";
import { Exception } from "magic";

const materializeFor = (parent: string) => (context: Context.t): TE.TaskEither<Exception.t, Materialize.Internal.t> => {
  return AccountChannel.materialize(context.user.id)(parent);
}

const resolveForAccount = (source: Account.Internal.t, args: any, context: Context.t): Promise<Transaction.Internal.t[]> => {
  const parent = O.match(() => "", (parent: string) => parent)(source.parentId);

  return pipe(
      materializeFor(parent)(context)
    , TE.map((materialize) => {
        const out = materialize.tagged[source.id]
        if (out) {
          return out
        } else {
          return [];
        }
      })
    , toPromise
  );
}

const resolveForUntagged =
  (parent: string) =>
  (source: any, args: any, context: Context.t): Promise<Transaction.Internal.t[]> => {
  return pipe(
      materializeFor(parent)(context)
    , TE.map((materialize) => materialize.untagged)
    , toPromise
  );
}

// TODO: JK comments
const TransactionType = {
    id: { type: graphql.GraphQLString }
  , sourceId: { type: graphql.GraphQLString }
  , amount: { type: graphql.GraphQLFloat }
  , merchantName: { type: graphql.GraphQLString }
  , description: { type: graphql.GraphQLString }
  , authorizedAt: { type: graphql.GraphQLInt }
  , capturedAt: { type: graphql.GraphQLInt }
}

export namespace Transactions {
  export const t = {
      type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'Transaction'
        , fields: TransactionType
      }))
    , resolve: resolveForAccount
  }
}

// TODO: need to pull ID off of context
export namespace Untagged {
  export const t = {
      type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'UntaggedTransaction'
        , fields: TransactionType
      }))
    , resolve: resolveForUntagged(VIRTUAL_ACCOUNT)
  }
}
