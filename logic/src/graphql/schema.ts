import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as UserResolver from './user-resolver';
import * as AccountResolver from './account-resolver';
import * as TransactionResolver from './transaction-resolver';
import MutationType from './mutation/index';

const queryType = new graphql.GraphQLObjectType({
    name: 'Query'
  , fields: {
        user: UserResolver.t
      , accounts: AccountResolver.Accounts.t
      , buckets: AccountResolver.Buckets.t
      , untagged: TransactionResolver.Untagged.t
      , conflicts: TransactionResolver.Conflicts.t
    }
});

const schema = new graphql.GraphQLSchema({ query: queryType, mutation: MutationType });

export default schema;