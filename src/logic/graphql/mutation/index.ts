import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";
import { GraphQLJSONObject } from 'graphql-type-json';

import { UserArena, UserResource } from "../../../user";
import * as Context from "../context";
import * as Types from "../types";

import { Account, Rule, Transaction } from "../../../model";
import { Exception, Pipe } from "../../../magic";

export namespace CreateBucket {
  const JustBucket = new graphql.GraphQLObjectType({
      name: 'JustBucket'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  })

  type Args = { name: string; };
  const Args = { name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { name }: Args, context: Context.t): Promise<Account.Internal.t> => {
    return pipe(
        UserResource.Bucket.create(context.pool)(context.arena)(name)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(JustBucket)
    , args: Args
    , resolve: resolve
  };
}

export namespace CreateAccount {
  const JustAccount = new graphql.GraphQLObjectType({
      name: 'JustAccount'
    , fields: {
          id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
      }
  })

  type Args = { name: string; };
  const Args = { name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { name }: Args, context: Context.t): Promise<Account.Internal.t> => {
    return pipe(
        UserResource.Account.create(context.pool)(context.arena)(name)
      , TE.map(({ account }) => account)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(JustAccount)
    , args: Args
    , resolve: resolve
  };
}

export namespace CreateTransaction {
  type Args = {
    sourceId: string;
    amount: number;
    merchantName: string;
    description: string;
    authorizedAt: number;
    capturedAt?: number;
    metadata: object;
  };
  const Args = {
      sourceId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , amount: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
    , merchantName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , description: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , authorizedAt: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
    , capturedAt: { type: graphql.GraphQLFloat }
    , metadata: { type: new graphql.GraphQLNonNull(GraphQLJSONObject) }
  };

  const resolve = (source: any, args: Args, context: Context.t): Promise<Transaction.Internal.t> => {
    const authorizedAt: Date = new Date(args.authorizedAt);
    const capturedAt: O.Option<Date> = pipe(
        O.fromNullable(args.capturedAt)
      , O.map((capturedAt) => new Date(capturedAt))
    );

    return pipe(
        UserResource.Transaction.create(context.pool)(context.arena)({ ...args, authorizedAt: authorizedAt, capturedAt: capturedAt })
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Transaction.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace CreateSplitByValue {
  type Value = { bucket: string, value: number };
  const Value = new graphql.GraphQLInputObjectType({
      name: "Value"
    , fields: {
          bucket: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        , value: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
      }
  });

  type Args = { transactionId: string; splits: Value[]; remainder: string; };
  const Args = {
      transactionId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    , splits: { type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Value)) }
    , remainder: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  }

  const resolve = (source: any, { transactionId, splits, remainder }: Args, context: Context.t): Promise<Rule.Internal.t> => {
    return pipe(
        UserResource.Rule.splitTransaction(context.pool)(context.arena)(transactionId, splits, remainder)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Rule.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace DeleteRule {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserResource.Rule.remove(context.pool)(context.arena)(id)
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace DeleteIntegration {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserResource.Integration.remove(context.pool)(context.arena)(id)
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace DeleteAccount {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserResource.Account.remove(context.pool)(context.arena)(id)
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace DeleteBucket {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserResource.Bucket.remove(context.pool)(context.arena)(id)
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace DeleteSource {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserResource.Source.remove(context.pool)(context.arena)(id)
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace DeleteTransaction {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    return pipe(
        UserResource.Transaction.remove(context.pool)(context.arena)(id)
      , TE.map(() => true)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Void.t)
    , args: Args
    , resolve: resolve
  };
}
