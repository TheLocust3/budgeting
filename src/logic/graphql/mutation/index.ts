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

import { Account, Rule, Transaction, Template } from "../../../model";
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
    context.log.info(`CreateBucket.resolve - ${name}`)
    return pipe(
        UserResource.Bucket.create(context.pool)(context.log)(context.arena)(name)
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
    context.log.info(`CreateAccount.resolve - ${name}`)
    return pipe(
        UserResource.Account.create(context.pool)(context.log)(context.arena)(name)
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

export namespace CreateTemplate {
  type Args = { accountId: string; template: object };
  const Args = {
    accountId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
    template: { type: new graphql.GraphQLNonNull(GraphQLJSONObject) }
  };

  const resolve = (source: any, { accountId, template }: Args, context: Context.t): Promise<Template.Internal.t> => {
    context.log.info(`CreateTemplate.resolve - ${accountId} - ${template}`)
    return pipe(
        UserResource.Template.create(context.pool)(context.log)(context.arena)(accountId, template)
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Template.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace CreateTransaction {
  type Args = Types.Transaction.Input.t;
  const Args = Types.Transaction.Input.t;

  const resolve = (source: any, args: Args, context: Context.t): Promise<Transaction.Internal.t> => {
    context.log.info(`CreateTransaction.resolve - ${args}`)

    const authorizedAt: Date = new Date(args.authorizedAt);
    const capturedAt: O.Option<Date> = pipe(
        O.fromNullable(args.capturedAt)
      , O.map((capturedAt) => new Date(capturedAt))
    );
    const metadata: object = pipe(
        O.fromNullable(args.metadata)
      , O.getOrElse(() => <object>{})
    );

    return pipe(
        UserResource.Transaction.create(context.pool)(context.log)(context.arena)({ ...args, authorizedAt: authorizedAt, capturedAt: capturedAt, metadata: metadata })
      , Pipe.toPromise
    );
  }

  export const t = {
      type: new graphql.GraphQLNonNull(Types.Transaction.t)
    , args: Args
    , resolve: resolve
  };
}

export namespace CreateTransactions {
  type Args = {
    transactions: Types.Transaction.Input.t[]
  };
  const Args = {
    transactions: {
      type: new graphql.GraphQLNonNull(new graphql.GraphQLList(new graphql.GraphQLInputObjectType({
          name: "TransactionInput"
        , fields: Types.Transaction.Input.t
      })))
    }
  };

  const resolve = (source: any, args: Args, context: Context.t): Promise<Transaction.Internal.t[]> => {
    context.log.info(`CreateTransactions.resolve - ${args}`)
    return pipe(
        args.transactions
      , A.mapWithIndex((index, transaction) => {
          const authorizedAt: Date = new Date(transaction.authorizedAt);
          const capturedAt: O.Option<Date> = pipe(
              O.fromNullable(transaction.capturedAt)
            , O.map((capturedAt) => new Date(capturedAt))
          );
          const metadata: object = pipe(
              O.fromNullable(transaction.metadata)
            , O.getOrElse(() => <object>{})
          );

          return UserResource.Transaction.create(context.pool)(context.log)(context.arena)({ ...transaction, authorizedAt: authorizedAt, capturedAt: capturedAt, metadata: metadata }, `transaction_${index}`);
        })
      , A.sequence(TE.ApplicativeSeq)
      , Pipe.toPromise
    )
  }

  export const t = {
      type: new graphql.GraphQLList(Types.Transaction.t)
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
    context.log.info(`CreateSplitByValue.resolve - ${{ transactionId, splits, remainder }}`)
    return pipe(
        UserResource.Rule.splitTransaction(context.pool)(context.log)(context.arena)(transactionId, splits, remainder)
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
    context.log.info(`DeleteRule.resolve - ${id}`)
    return pipe(
        UserResource.Rule.remove(context.pool)(context.log)(context.arena)(id)
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
    context.log.info(`DeleteIntegration.resolve - ${id}`)
    return pipe(
        UserResource.Integration.remove(context.pool)(context.log)(context.arena)(id)
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
    context.log.info(`DeleteAccount.resolve - ${id}`)
    return pipe(
        UserResource.Account.remove(context.pool)(context.log)(context.arena)(id)
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
    context.log.info(`DeleteBucket.resolve - ${id}`)
    return pipe(
        UserResource.Bucket.remove(context.pool)(context.log)(context.arena)(id)
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

export namespace DeleteTemplate {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    context.log.info(`DeleteTemplate.resolve - ${id}`)
    return pipe(
        UserResource.Template.remove(context.pool)(context.log)(context.arena)(id)
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
    context.log.info(`DeleteTransaction.resolve - ${id}`)
    return pipe(
        UserResource.Transaction.remove(context.pool)(context.log)(context.arena)(id)
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

export namespace AckNotification {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    context.log.info(`AckNotification.resolve - ${id}`)
    return pipe(
        UserResource.Notification.ack(context.pool)(context.log)(context.arena)(id)
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

export namespace DeleteNotification {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<boolean> => {
    context.log.info(`DeleteNotification.resolve - ${id}`)
    return pipe(
        UserResource.Notification.remove(context.pool)(context.log)(context.arena)(id)
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
