import Express from "express";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { Transactions } from "./transaction-resolver";
import { Context } from "./context";
import { toPromise } from "./util";
import AccountChannel from "../channel/account-channel";
import { PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../constants";

import { Account } from "model";
import { Exception } from "magic";

type AccountContext = {
  account: Account.Internal.t;
  children: AccountContext[];
}

const contextFor = (accounts: Account.Internal.t[]) => (forAccount: Account.Internal.t): AccountContext => {
  const isParentOf = (account: Account.Internal.t): boolean => {
    return O.match(
        () => false
      , (parentId) => parentId === forAccount.id
    )(account.parentId);
  }

  return {
      account: forAccount
    , children: pipe(accounts, A.filter((account) => isParentOf(account)), A.map(contextFor(accounts)))
  }
}

const resolveAccount = 
  (name: string) =>
  (context: Context): TE.TaskEither<Exception.t, AccountContext> => {
  const forName = (name: string) => (accounts: Account.Internal.t[]): TE.TaskEither<Exception.t, Account.Internal.t> => {
    const matching = A.filter((account: Account.Internal.t) => account.name === name)(accounts);

    if (matching.length === 0) {
      return TE.throwError(Exception.throwNotFound);
    } else {
      return TE.of(matching[0]);
    }
  }

  return pipe(
      TE.Do
    , TE.bind("allAccounts", () => AccountChannel.all(context.user.id))
    , TE.bind("account", ({ allAccounts }) => forName(name)(allAccounts))
    , TE.map(({ allAccounts, account }) => {
        return contextFor(allAccounts)(account);
      })
  );
}

const nameFor = (key: "physical" | "virtual") => {
  switch (key) {
    case "physical":
      return PHYSICAL_ACCOUNT;
    case "virtual":
    return VIRTUAL_ACCOUNT;
  }
}

const resolveChildrenFor = 
  (key: "physical" | "virtual") =>
  (source: any, args: any, context: Context): Promise<Account.Internal.t[]> => {
  return pipe(
      resolveAccount(nameFor(key))(context)
    , TE.map((context: AccountContext) => {
        return A.map((child: AccountContext) => child.account)(context.children)
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
          }
      }))
    , resolve: resolveChildrenFor("virtual")
  }
}
