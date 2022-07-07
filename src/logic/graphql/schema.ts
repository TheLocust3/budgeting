import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as UserResolver from './user-resolver';
import * as AccountResolver from './account-resolver';
import * as RuleResolver from './rule-resolver';
import * as TransactionResolver from './transaction-resolver';
import * as IntegrationsResolver from './integrations-resolver';
import * as Mutation from './mutation/index';
import * as PlaidMutation from "./mutation/plaid-mutation";

const queryType = new graphql.GraphQLObjectType({
    name: 'Query'
  , fields: {
        user: UserResolver.t
      , total: TransactionResolver.Transactions.Total.t
      , accounts: AccountResolver.Accounts.t
      , buckets: AccountResolver.Buckets.t
      , rules: RuleResolver.Rules.Virtual.t
      , untagged: TransactionResolver.Untagged.t
      , conflicts: TransactionResolver.Conflicts.t
      , integrations: IntegrationsResolver.t
    }
});

const mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation'
  , fields: {
        createBucket: Mutation.CreateBucket.t
      , createManualAccount: Mutation.CreateAccount.t
      , createSplitByValue: Mutation.CreateSplitByValue.t
      , createTransaction: Mutation.CreateTransaction.t
      , deleteRule: Mutation.DeleteRule.t
      , deleteIntegration: Mutation.DeleteIntegration.t
      , deleteAccount: Mutation.DeleteAccount.t
      , deleteSource: Mutation.DeleteSource.t
      , deleteBucket: Mutation.DeleteBucket.t
      , deleteTransaction: Mutation.DeleteTransaction.t
      , createLinkToken: PlaidMutation.CreateLinkToken.t
      , exchangePublicToken: PlaidMutation.ExchangePublicToken.t
    }
});

const schema = new graphql.GraphQLSchema({ query: queryType, mutation: mutationType });

export default schema;