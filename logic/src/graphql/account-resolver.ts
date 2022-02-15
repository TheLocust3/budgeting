import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import { Context, AccountContext } from "./context";
import { toPromise } from "./util";
import AccountChannel from "../channel/account-channel";
import { GLOBAL_ACCOUNT, PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../constants";

import { Account } from "model";
import { Exception } from "magic";

const contextFor = (accounts: Account.Internal.t[]) => (forAccount: Account.Internal.t): AccountContext.t & AccountContext.WithChildren => {
  const isParentOf = (account: Account.Internal.t): boolean => {
    return O.match(
        () => false
      , (parentId) => parentId === forAccount.id
    )(account.parentId);
  }

  return {
      account: forAccount
    , rules: O.none
    , children: pipe(accounts, A.filter((account) => isParentOf(account)), A.map(contextFor(accounts)))
  }
}

const resolveAccountContexts = (request: Express.Request): TE.TaskEither<Exception.t, void> => {
  const forName = (name: string) => (accounts: Account.Internal.t[]): TE.TaskEither<Exception.t, Account.Internal.t> => {
    const matching = A.filter((account: Account.Internal.t) => account.name === name)(accounts);

    if (matching.length === 0) {
      return TE.throwError(Exception.throwNotFound);
    } else {
      return TE.of(matching[0]);
    }
  }
  const context: Context = request.context;

  return pipe(
      TE.Do
    , TE.bind("accounts", () => AccountChannel.all(context.user.id))
    , TE.bind("globalAccount", ({ accounts }) => forName(GLOBAL_ACCOUNT)(accounts))
    , TE.bind("physicalAccount", ({ accounts }) => forName(PHYSICAL_ACCOUNT)(accounts))
    , TE.bind("virtualAccount", ({ accounts }) => forName(VIRTUAL_ACCOUNT)(accounts))
    , TE.map(({ accounts, globalAccount, physicalAccount, virtualAccount }) => {
        request.context.global = O.some({ account: globalAccount, rules: O.none });
        request.context.physical = O.some(contextFor(accounts)(physicalAccount));
        request.context.virtual = O.some(contextFor(accounts)(virtualAccount));
      })
  );
}

const resolveAccount = (request: Express.Request) => (key: "physical" | "virtual" | "global"): TE.TaskEither<Exception.t, Account.Internal.t> => {
  return pipe(
      O.match(
          () => pipe(resolveAccountContexts(request), TE.map(() => true)) // just need to return _something_
        , (_) => { return TE.of(true) }
      )(request.context[key])
    , TE.chain(() => O.match(
          () => <TE.TaskEither<Exception.t, Account.Internal.t>>TE.throwError(Exception.throwInternalError)
        , (context: AccountContext.t) => TE.of(context.account)
      )(request.context[key]))
  );
}

type Field = "id" | "name";
const resolveAccountField =
  (key: "physical" | "virtual" | "global") =>
  (field: Field) =>
  (source: any, args: any, request: Express.Request): Promise<string> => {
  return pipe(
      resolveAccount(request)(key)
    , TE.map((account) => account[field])
    , toPromise
  );
}

export namespace Global {
  export const t = new graphql.GraphQLObjectType({
    name: 'GlobalAccount',
    fields: {
      id: { type: graphql.GraphQLString, resolve: resolveAccountField("global")("id") },
      name: { type: graphql.GraphQLString, resolve: resolveAccountField("global")("name") }
    }
  });
}

export namespace Physical {
  export const t = new graphql.GraphQLObjectType({
    name: 'PhysicalAccount',
    fields: {
      id: { type: graphql.GraphQLString, resolve: resolveAccountField("physical")("id") },
      name: { type: graphql.GraphQLString, resolve: resolveAccountField("physical")("name") }
    }
  });
}

export namespace Virtual {
  export const t = new graphql.GraphQLObjectType({
    name: 'VirtualAccount',
    fields: {
      id: { type: graphql.GraphQLString, resolve: resolveAccountField("virtual")("id") },
      name: { type: graphql.GraphQLString, resolve: resolveAccountField("virtual")("name") }
    }
  });
}
