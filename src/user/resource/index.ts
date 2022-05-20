import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { GLOBAL_ACCOUNT, PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../util";
import { UserArena } from "../index";

import { Validate } from "../../engine";
import { User, Account, Rule, Source, Integration, Plaid } from "../../model";
import { AccountFrontend, IntegrationFrontend, SourceFrontend, RuleFrontend, UserFrontend } from "../../storage";
import { Exception, Message, Plaid as PlaidHelper, Route, Pipe } from "../../magic";

export const createUser = (pool: Pool) => (user: User.Frontend.Create.t): TE.TaskEither<Exception.t, User.Internal.t> => {
  return pipe(
      TE.Do
    , TE.bind("user", () => UserFrontend.create(pool)(user))
    , TE.bind("globalAccount", ({ user }) => AccountFrontend.create(pool)({ parentId: O.none, userId: user.id, name: GLOBAL_ACCOUNT }))
    , TE.bind("globalRule", ({ user, globalAccount }) => {
        return RuleFrontend.create(pool)({
            accountId: globalAccount.id
          , userId: user.id
          , rule: <Rule.Internal.Rule>{ _type: "Include", where: { _type: "StringMatch", field: "userId", operator: "Eq", value: user.id } }
        });
      })
    , TE.bind("physicalAccount", ({ user, globalAccount }) => AccountFrontend.create(pool)({ parentId: O.some(globalAccount.id), userId: user.id, name: PHYSICAL_ACCOUNT }))
    , TE.bind("virtualAccount", ({ user, globalAccount }) => AccountFrontend.create(pool)({ parentId: O.some(globalAccount.id), userId: user.id, name: VIRTUAL_ACCOUNT }))
    , TE.map(({ user }) => user)
  );
}

const createAccount = (pool: Pool) => (arena: UserArena.t) => (source: Source.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
  const createSingleAccount = (): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        UserArena.physical(pool)(arena)
      , TE.map((physical) => ({ userId: arena.user.id, parentId: O.some(physical.account.id), name: source.name }))
      , TE.chain(AccountFrontend.create(pool))
    );
  }

  return pipe(
      TE.Do
    , TE.bind("account", () => createSingleAccount())
    , TE.bind("rule", ({ account }) => createRule(pool)(arena)("physical")(<Rule.Internal.Rule>{
          _type: "SplitByPercent"
        , where: { _type: "StringMatch", field: "sourceId", operator: "Eq", value: source.id }
        , splits: [{ _type: "Percent", account: account.id, percent: 1 }]
      }))
    , TE.map(({ account }) => account)
  );
}

export const createBucket = (pool: Pool) => (arena: UserArena.t) => (name: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
  return pipe(
      UserArena.virtual(pool)(arena)
    , TE.map((virtual) => ({ userId: arena.user.id, parentId: O.some(virtual.account.id), name: name }))
    , TE.chain(AccountFrontend.create(pool))
  );
}

type UserAccount = "physical" | "virtual";
const resolveUserAccount = (pool: Pool) => (arena: UserArena.t) => (key: UserAccount): TE.TaskEither<Exception.t, UserArena.Account.t> => {
  switch (key) {
    case "physical":
      return UserArena.physical(pool)(arena);
    case "virtual":
      return UserArena.virtual(pool)(arena);
  }
}

const createRule =
  (pool: Pool) => 
  (arena: UserArena.t) =>
  (key: UserAccount) =>
  (rule: Rule.Internal.Rule): TE.TaskEither<Exception.t, Rule.Internal.t> => {
  return pipe(
      resolveUserAccount(pool)(arena)(key)
    , TE.chain((account) => {
        return pipe(
            <Rule.Frontend.Create.t> { accountId: account.account.id, userId: arena.user.id, rule: rule }
          , Validate.rule(pool)
          , TE.chain(RuleFrontend.create(pool))
        );
      })
  );
}

export const splitTransaction =
  (pool: Pool) => 
  (arena: UserArena.t) =>
  (transactionId: string, splits: { bucket: string, value: number}[], remainder: string): TE.TaskEither<Exception.t, Rule.Internal.t> => {
  return pipe(
      UserArena.virtual(pool)(arena)
    , TE.chain((virtual) => createRule(pool)(arena)("virtual")(<Rule.Internal.Split.SplitByValue>{
          _type: "SplitByValue"
        , where: { _type: "StringMatch", field: "id", operator: "Eq", value: transactionId }
        , splits: A.map(({ bucket, value }: { bucket: string, value: number}) =>
            ({ _type: "Value", account: bucket, value: value })
          )(splits)
        , remainder: remainder
      }))
  );
}

export const removeRule = (pool: Pool) => (arena: UserArena.t) => (ruleId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      UserArena.virtual(pool)(arena)
    , TE.chain((virtual) => RuleFrontend.deleteById(pool)(arena.user.id)(virtual.account.id)(ruleId))
    , TE.map(() => {})
  );
}

export const removeIntegration = (pool: Pool) => (arena: UserArena.t) => (integrationId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      IntegrationFrontend.deleteById(pool)(arena.user.id)(integrationId)
    , TE.map(() => {})
  );
}

export const createIntegration =
  (pool: Pool) =>
  (requestId: string) =>
  (arena: UserArena.t) =>
  (request: { institutionName: string, accounts: { id: string, name: string }[] }) =>
  (publicToken: { item_id: string, access_token: string }): TE.TaskEither<Exception.t, void> => {
  const user = arena.user;

  console.log(`[${requestId}] - building integration/sources`);

  const buildIntegration = (): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    console.log(`[${requestId}] - building integration "${request.institutionName}"`);
    const integration: Integration.Frontend.Create.t = {
        userId: user.id
      , name: request.institutionName
      , credentials: { _type: "Plaid", itemId: publicToken.item_id, accessToken: publicToken.access_token }
    };

    return IntegrationFrontend.create(pool)(integration);
  }

  const buildSources = (integration: Integration.Internal.t): TE.TaskEither<Exception.t, Source.Internal.t[]> => {
    console.log(`[${requestId}] - building sources "${request.accounts}"`);
    const sources: Source.Frontend.Create.t[] = A.map(({ id, name }: Plaid.External.Request.ExchangePublicToken.Account) => {
      return <Source.Frontend.Create.t>{
          userId: user.id
        , name: name
        , integrationId: O.some(integration.id)
        , tag: id
      };
    })(request.accounts);

    return pipe(
        sources
      , A.map(SourceFrontend.create(pool))
      , A.sequence(TE.ApplicativeSeq)
    );
  }

  const buildAccounts = (sources: Source.Internal.t[]): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    return pipe(
        sources
      , A.map(createAccount(pool)(arena))
      , A.sequence(TE.ApplicativeSeq)
    );
  }

  return pipe(
      buildIntegration()
    , TE.chain(buildSources)
    , TE.chain(buildAccounts)
    , TE.map(() => {
        console.log(`[${requestId}] - integration/sources built`);
      })
);
}
