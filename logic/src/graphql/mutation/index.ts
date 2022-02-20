import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as Context from "../context";
import * as Types from "../types";
import { toPromise } from "../util";
import * as PlaidMutation from "./plaid-mutation";

import AccountChannel from "../../channel/account-channel";
import RuleChannel from "../../channel/rule-channel";

import { Account, Rule } from "model";
import { Exception } from "magic";

namespace CreateBucket {
  const JustBucket = new graphql.GraphQLObjectType({
      name: 'JustBucket'
    , fields: {
          id: { type: graphql.GraphQLString }
        , name: { type: graphql.GraphQLString }
      }
  })

  type Args = { name: string; };
  const Args = { name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { name }: Args, context: Context.t): Promise<Account.Internal.t> => {
    return pipe(
        Context.virtual(context)
      , TE.map((virtual) => ({ userId: context.user.id, parentId: O.some(virtual.account.id), name: name }))
      , TE.chain(AccountChannel.create)
      , toPromise
    );
  }

  export const t = {
      type: JustBucket
    , args: Args
    , resolve: resolve
  };
}

namespace CreateSplitByValue {
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
    , splits: { type: new graphql.GraphQLList(Value) }
    , remainder: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
  }

  const resolve = (source: any, { transactionId, splits, remainder }: Args, context: Context.t): Promise<Rule.Internal.t> => {
    return pipe(
        Context.virtual(context)
      , TE.map((virtual) => ({
            accountId: virtual.account.id
          , userId: context.user.id
          , rule: <Rule.Internal.Split.SplitByValue>{
                _type: "SplitByValue"
              , where: { _type: "StringMatch", field: "id", operator: "Eq", value: transactionId }
              , splits: A.map(({ bucket, value }: Value) => ({ _type: "Value", account: bucket, value: value }))(splits)
              , remainder: remainder
            }
        }))
      , TE.chain(RuleChannel.create)
      , toPromise
    );
  }

  export const t = {
      type: Types.Rule.t
    , args: Args
    , resolve: resolve
  };
}

namespace DeleteRule {
  type Args = { id: string; };
  const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };

  const resolve = (source: any, { id }: Args, context: Context.t): Promise<{}> => {
    return pipe(
        Context.virtual(context)
      , TE.chain((virtual) => RuleChannel.deleteById(context.user.id)(virtual.account.id)(id))
      , TE.map(() => true)
      , toPromise
    );
  }

  export const t = {
      type: Types.Void.t
    , args: Args
    , resolve: resolve
  };
}

export const mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation'
  , fields: {
        createBucket: CreateBucket.t
      , createSplitByValue: CreateSplitByValue.t
      , deleteRule: DeleteRule.t
      , createLinkToken: PlaidMutation.CreateLinkToken.t
      , exchangePublicToken: PlaidMutation.ExchangePublicToken.t
    }
});

export default mutationType;
