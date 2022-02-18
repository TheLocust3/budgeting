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

const materializeFor = (key: "physical" | "virtual") => (context: Context.t) => {
  switch (key) {
    case "physical":
      return Context.materializePhysical(context);
    case "virtual":
      return Context.materializeVirtual(context);
  }
}

const resolveForAccount =
  (key: "physical" | "virtual") =>
  (source: Account.Internal.t, args: any, context: Context.t): Promise<Transaction.Internal.t[]> => {
  return pipe(
      materializeFor(key)(context)
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

const resolveForUntagged = (source: any, args: any, context: Context.t): Promise<Transaction.Internal.t[]> => {
  return pipe(
      materializeFor("virtual")(context)
    , TE.map((materialize) => materialize.untagged)
    , toPromise
  );
}

const resolveForConflicts = (source: any, args: any, context: Context.t): Promise<Materialize.Internal.Conflict[]> => {
  return pipe(
      materializeFor("virtual")(context)
    , TE.map((materialize) => materialize.conflicts)
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
  const TransactionList = new graphql.GraphQLList(new graphql.GraphQLObjectType({
      name: 'Transaction'
    , fields: TransactionType
  }));

  export namespace Physical {
    export const t = {
        type: TransactionList
      , resolve: resolveForAccount("physical")
    }
  }

    export namespace Virtual {
    export const t = {
        type: TransactionList
      , resolve: resolveForAccount("virtual")
    }
  }
}

export namespace Untagged {
  export const t = {
      type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: 'UntaggedTransaction'
        , fields: TransactionType
      }))
    , resolve: resolveForUntagged
  }
}
