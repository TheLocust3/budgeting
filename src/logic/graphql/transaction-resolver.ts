import Express from "express";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { UserArena } from "../../user";
import { Frontend } from "../../engine";
import * as Context from "./context";
import * as Types from "./types";

import { Account, Transaction, Materialize, Rule } from "../../model";
import { Exception, Pipe } from "../../magic";

const materializeFor = (key: "physical" | "virtual") => (context: Context.t) => {
  context.log.info(`TransactionResolver.materializeFor - ${key}`)
  switch (key) {
    case "physical":
      return UserArena.materializePhysical(context.pool)(context.log)(context.arena);
    case "virtual":
      return UserArena.materializeVirtual(context.pool)(context.log)(context.arena);
  }
}

const transformTransaction = (transaction: Transaction.Internal.t): Types.Transaction.t => {
  return <Types.Transaction.t>{
      id: transaction.id
    , sourceId: transaction.sourceId
    , amount: transaction.amount
    , merchantName: transaction.merchantName
    , description: transaction.description
    , authorizedAt: transaction.authorizedAt.getTime()
    , capturedAt: pipe(transaction.capturedAt, O.match(() => undefined, (capturedAt) => capturedAt.getTime()))
    , metadata: transaction.metadata
  };
}

const resolveForAccount =
  (key: "physical" | "virtual") =>
  (source: Account.Internal.t, args: any, context: Context.t): Promise<Types.Transaction.t[]> => {
  context.log.info(`TransactionResolver.resolveForAccount - ${key} - ${source.id}`)
  return pipe(
      materializeFor(key)(context)
    , TE.map((materialize) => {
        const out = materialize.tagged[source.id].transactions;
        if (out) {
          return A.map(transformTransaction)(out);
        } else {
          return [];
        }
      })
    , Pipe.toPromise
  );
}

const resolveTotalForAccount =
  (key: "physical" | "virtual") =>
  (source: Account.Internal.t, args: any, context: Context.t): Promise<number> => {
  context.log.info(`TransactionResolver.resolveTotalForAccount - ${key} - ${source.id}`)
  return pipe(
      materializeFor(key)(context)
    , TE.map((materialize) => {
        const out = materialize.tagged[source.id].total;
        if (out) {
          return out;
        } else {
          return 0;
        }
      })
    , Pipe.toPromise
  );
}

const resolveTotal =
  (key: "physical" | "virtual") =>
  (source: any, args: any, context: Context.t): Promise<number> => {
  context.log.info(`TransactionResolver.resolveTotal - ${key}`)
  return pipe(
      materializeFor(key)(context)
    , TE.map((materialize) => {
        const out = materialize.total;
        if (out) {
          return out;
        } else {
          return 0;
        }
      })
    , Pipe.toPromise
  );
}

const resolveForUntagged = (source: any, args: any, context: Context.t): Promise<Types.Transaction.t[]> => {
  context.log.info("TransactionResolver.resolveForUntagged")
  return pipe(
      materializeFor("virtual")(context)
    , TE.map((materialize) => A.map(transformTransaction)(materialize.untagged))
    , Pipe.toPromise
  );
}

const resolveForConflicts = (source: any, args: any, context: Context.t): Promise<Conflicts.t> => {
  context.log.info("TransactionResolver.resolveForConflicts")
  return pipe(
      materializeFor("virtual")(context)
    , TE.map((materialize) => {
        return pipe(
            materialize.conflicts
          , A.map(({ element, rules }) => ({ element: transformTransaction(element), rules: rules }))
        );
      })
    , Pipe.toPromise
  );
}

export namespace Transactions {
  export namespace Total {
    export const t = {
        type: new graphql.GraphQLNonNull(graphql.GraphQLFloat)
      , resolve: resolveTotal("physical")
    }
  }

  export namespace Physical {
    export const t = {
        type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.Transaction.t))
      , resolve: resolveForAccount("physical")
    }
  }

  export namespace PhysicalTotal {
    export const t = {
        type: new graphql.GraphQLNonNull(graphql.GraphQLFloat)
      , resolve: resolveTotalForAccount("physical")
    }
  }

  export namespace Virtual {
    export const t = {
        type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.Transaction.t))
      , resolve: resolveForAccount("virtual")
    }
  }

  export namespace VirtualTotal {
    export const t = {
        type: new graphql.GraphQLNonNull(graphql.GraphQLFloat)
      , resolve: resolveTotalForAccount("virtual")
    }
  }
}

export namespace Untagged {
  export const t = {
      type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.Transaction.t))
    , resolve: resolveForUntagged
  }
}

export namespace Conflicts {
  export type t = {
    element: Types.Transaction.t;
    rules: Rule.Internal.Rule[]
  }[];

  export const t = {
      type: new graphql.GraphQLNonNull(new graphql.GraphQLList(new graphql.GraphQLObjectType({
          name: "Conflict"
        , fields: {
              element: { type: new graphql.GraphQLNonNull(Types.Transaction.t) }
            , rules: { type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.RuleBody.t)) }
          }
      })))
    , resolve: resolveForConflicts
  }
}
