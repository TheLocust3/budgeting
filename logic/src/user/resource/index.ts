import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { GLOBAL_ACCOUNT, PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../util";
import { UserArena } from "../index";
import AccountChannel from "../../channel/account-channel";
import RuleChannel from "../../channel/rule-channel";

import { User, Account, Rule, Source, Integration, Plaid } from "model";
import { IntegrationFrontend, SourceFrontend, UserFrontend } from "storage";
import { Exception, Message, Plaid as PlaidHelper, Route, Pipe } from "magic";

export const createUser = (pool: Pool) => (user: User.Frontend.Create.t): TE.TaskEither<Exception.t, User.Internal.t> => {
  return pipe(
      TE.Do
    , TE.bind("user", () => UserFrontend.create(pool)(user))
    , TE.bind("globalAccount", ({ user }) => AccountChannel.create({ parentId: O.none, userId: user.id, name: GLOBAL_ACCOUNT }))
    , TE.bind("globalRule", ({ user, globalAccount }) => {
        return RuleChannel.create({
            accountId: globalAccount.id
          , userId: user.id
          , rule: <Rule.Internal.Rule>{ _type: "Include", where: { _type: "StringMatch", field: "userId", operator: "Eq", value: user.id } }
        });
      })
    , TE.bind("physicalAccount", ({ user, globalAccount }) => AccountChannel.create({ parentId: O.some(globalAccount.id), userId: user.id, name: PHYSICAL_ACCOUNT }))
    , TE.bind("virtualAccount", ({ user, globalAccount }) => AccountChannel.create({ parentId: O.some(globalAccount.id), userId: user.id, name: VIRTUAL_ACCOUNT }))
    , TE.map(({ user }) => user)
  );
}

export const createBucket = (arena: UserArena.t) => (name: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
  return pipe(
      UserArena.virtual(arena)
    , TE.map((virtual) => ({ userId: arena.user.id, parentId: O.some(virtual.account.id), name: name }))
    , TE.chain(AccountChannel.create)
  );
}

export const splitTransaction =
  (arena: UserArena.t) =>
  (transactionId: string, splits: { bucket: string, value: number}[], remainder: string): TE.TaskEither<Exception.t, Rule.Internal.t> => {
  return pipe(
      UserArena.virtual(arena)
    , TE.map((virtual) => ({
          accountId: virtual.account.id
        , userId: arena.user.id
        , rule: <Rule.Internal.Split.SplitByValue>{
              _type: "SplitByValue"
            , where: { _type: "StringMatch", field: "id", operator: "Eq", value: transactionId }
            , splits: A.map(({ bucket, value }: { bucket: string, value: number}) =>
                ({ _type: "Value", account: bucket, value: value })
              )(splits)
            , remainder: remainder
          }
      }))
    , TE.chain(RuleChannel.create)
  );
}

export const removeRule = (arena: UserArena.t) => (ruleId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      UserArena.virtual(arena)
    , TE.chain((virtual) => RuleChannel.deleteById(arena.user.id)(virtual.account.id)(ruleId))
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

  const buildSources = (integration: Integration.Internal.t): TE.TaskEither<Exception.t, void> => {
    console.log(`[${requestId}] - building sources "${request.accounts}"`);
    const sources: Source.Frontend.Create.t[] = A.map(({ id, name }: Plaid.External.Request.ExchangePublicToken.Account) => {
      return <Source.Frontend.Create.t>{
          userId: user.id
        , name: name
        , integrationId: O.some(integration.id)
        , metadata: O.some({ _type: "Plaid", accountId: id })
      };
    })(request.accounts);

    return pipe(
        sources
      , A.map(SourceFrontend.create(pool))
      , A.sequence(TE.ApplicativeSeq)
      , TE.map(() => {
          console.log(`[${requestId}] - integration/sources built`);
        })
    );
  }

  return pipe(
      buildIntegration()
    , TE.chain(buildSources)
  );
}
