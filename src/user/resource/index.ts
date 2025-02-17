import { Pool } from "pg";
import { Logger } from "pino";
import { PlaidApi } from "plaid";
import { v5 as uuid } from 'uuid';
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { GLOBAL_ACCOUNT, PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../util";
import { UserArena } from "../index";

import { Validate } from "../../engine";
import { Context } from "../../job/util"
import { rollupFor } from "../../job/rollup/rollup-job";
import { User, Account, Rule, Source, Integration, Plaid, Transaction, Template } from "../../model";
import { AccountFrontend, IntegrationFrontend, SourceFrontend, RuleFrontend, TransactionFrontend, UserFrontend, NotificationFrontend, TemplateFrontend } from "../../storage";
import { Exception, Message, Plaid as PlaidHelper, Route, Pipe } from "../../magic";

export const getOrCreateUser = (pool: Pool) => (log : Logger) => (user: User.Frontend.FromFirebase.t): TE.TaskEither<Exception.t, User.Internal.t> => {
  const idFor = (tag: string) => {
    return uuid(`${user.id}_${tag}`, uuid.URL);
  }

  return pipe(
      UserFrontend.getById(pool)(log)(user.id)
    , TE.orElse(() => pipe(
          TE.Do
        , TE.bind("user", () => UserFrontend.createFromFirebase(pool)(log)(user))
        , TE.bind("globalAccount", ({ user }) => AccountFrontend.create(pool)(log)({ id: idFor("account_global"), parentId: O.none, userId: user.id, name: GLOBAL_ACCOUNT, metadata: { sourceId: O.none } }))
        , TE.bind("globalRule", ({ user, globalAccount }) => {
            return RuleFrontend.create(pool)(log)({
                id: idFor("rule_global")
              , accountId: globalAccount.id
              , userId: user.id
              , rule: <Rule.Internal.Rule>{ _type: "Include", where: { _type: "StringMatch", field: "userId", operator: "Eq", value: user.id } }
            });
          })
        , TE.bind("physicalAccount", ({ user, globalAccount }) => AccountFrontend.create(pool)(log)({ id: idFor("account_physical"), parentId: O.some(globalAccount.id), userId: user.id, name: PHYSICAL_ACCOUNT, metadata: { sourceId: O.none } }))
        , TE.bind("virtualAccount", ({ user, globalAccount }) => AccountFrontend.create(pool)(log)({ id: idFor("account_virtual"), parentId: O.some(globalAccount.id), userId: user.id, name: VIRTUAL_ACCOUNT, metadata: { sourceId: O.none } }))
        , TE.map(({ user }) => user)
      ))
  );
}

export const createUser = (pool: Pool) => (log : Logger) => (user: User.Frontend.Create.t): TE.TaskEither<Exception.t, User.Internal.t> => {
  const idFor = (tag: string) => {
    return uuid(`${user.id}_${tag}`, uuid.URL);
  }

  return pipe(
      TE.Do
    , TE.bind("user", () => UserFrontend.create(pool)(log)(user))
    , TE.bind("globalAccount", ({ user }) => AccountFrontend.create(pool)(log)({ id: idFor("account_global"), parentId: O.none, userId: user.id, name: GLOBAL_ACCOUNT, metadata: { sourceId: O.none } }))
    , TE.bind("globalRule", ({ user, globalAccount }) => {
        return RuleFrontend.create(pool)(log)({
            id: idFor("rule_global")
          , accountId: globalAccount.id
          , userId: user.id
          , rule: <Rule.Internal.Rule>{ _type: "Include", where: { _type: "StringMatch", field: "userId", operator: "Eq", value: user.id } }
        });
      })
    , TE.bind("physicalAccount", ({ user, globalAccount }) => AccountFrontend.create(pool)(log)({ id: idFor("account_physical"), parentId: O.some(globalAccount.id), userId: user.id, name: PHYSICAL_ACCOUNT, metadata: { sourceId: O.none } }))
    , TE.bind("virtualAccount", ({ user, globalAccount }) => AccountFrontend.create(pool)(log)({ id: idFor("account_virtual"), parentId: O.some(globalAccount.id), userId: user.id, name: VIRTUAL_ACCOUNT, metadata: { sourceId: O.none } }))
    , TE.map(({ user }) => user)
  );
}

const createAccount = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (source: Source.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
  const createSingleAccount = (): TE.TaskEither<Exception.t, Account.Internal.t> => {
    return pipe(
        UserArena.physical(pool)(log)(arena)
      , TE.map((physical) => ({ id: UserArena.idFor(arena)(`account_${source.name}`), userId: arena.user.id, parentId: O.some(physical.account.id), name: source.name, metadata: { sourceId: O.some(source.id) } }))
      , TE.chain(AccountFrontend.create(pool)(log))
    );
  }

  return pipe(
      TE.Do
    , TE.bind("account", () => createSingleAccount())
    , TE.bind("rule", ({ account }) => createRule(pool)(log)(arena)(`rule_${source.name}`)("physical")(<Rule.Internal.Rule>{
          _type: "SplitByPercent"
        , where: { _type: "StringMatch", field: "sourceId", operator: "Eq", value: source.id }
        , splits: [{ _type: "Percent", account: account.id, percent: 1 }]
      }))
    , TE.map(({ account }) => account)
  );
}

export const createBucket = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (name: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
  return pipe(
      UserArena.virtual(pool)(log)(arena)
    , TE.map((virtual) => ({ id: UserArena.idFor(arena)(`bucket_${name}`), userId: arena.user.id, parentId: O.some(virtual.account.id), name: name, metadata: { sourceId: O.none } }))
    , TE.chain(AccountFrontend.create(pool)(log))
  );
}

export const createTemplate = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (accountId: string, template: object): TE.TaskEither<Exception.t, Template.Internal.t> => {
  return pipe(
      TE.Do
    , TE.bind("physicalAccount", () => resolveUserAccount(pool)(log)(arena)("physical"))
    , TE.bind("account", () => AccountFrontend.getByIdAndUserId(pool)(log)(arena.user.id)(accountId))
    , TE.bind("validate", ({ physicalAccount, account }) => {
        if (pipe(account.parentId, O.map((parentId) => parentId === physicalAccount.account.id), O.getOrElse(() => false))) {
          return TE.of(true)
        } else {
          return TE.throwError(Exception.throwValidationError(`${accountId} is not a physical account`))
        }
      })
    , TE.bind("created", () => {
        return TemplateFrontend.create(pool)(log)({ id: UserArena.idFor(arena)(`template_${JSON.stringify(template)}`), accountId: accountId, userId: arena.user.id, template: template });
      })
    , TE.map(({ created }) => created)
  );
}


type UserAccount = "physical" | "virtual";
const resolveUserAccount = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (key: UserAccount): TE.TaskEither<Exception.t, UserArena.Account.t> => {
  switch (key) {
    case "physical":
      return UserArena.physical(pool)(log)(arena);
    case "virtual":
      return UserArena.virtual(pool)(log)(arena);
  }
}

const createRule =
  (pool: Pool) => 
  (log : Logger) =>
  (arena: UserArena.t) =>
  (tag: string) =>
  (key: UserAccount) =>
  (rule: Rule.Internal.Rule): TE.TaskEither<Exception.t, Rule.Internal.t> => {
  return pipe(
      resolveUserAccount(pool)(log)(arena)(key)
    , TE.chain((account) => {
        return pipe(
            <Rule.Frontend.Create.t> { id: UserArena.idFor(arena)(tag), accountId: account.account.id, userId: arena.user.id, rule: rule }
          , Validate.rule(pool)(log)
          , TE.chain(RuleFrontend.create(pool)(log))
        );
      })
  );
}

export const splitTransaction =
  (pool: Pool) => 
  (log : Logger) =>
  (arena: UserArena.t) =>
  (transactionId: string, splits: { bucket: string, value: number}[], remainder: string): TE.TaskEither<Exception.t, Rule.Internal.t> => {
  return pipe(
      TE.Do
    , TE.bind("validateTransaction", () => TransactionFrontend.getById(pool)(log)(arena.user.id)(transactionId))
    , TE.bind("virtual", () => UserArena.virtual(pool)(log)(arena))
    , TE.chain(({ virtual }) => createRule(pool)(log)(arena)(`rule_${transactionId}`)("virtual")(<Rule.Internal.Split.SplitByValue>{
          _type: "SplitByValue"
        , where: { _type: "StringMatch", field: "id", operator: "Eq", value: transactionId }
        , splits: A.map(({ bucket, value }: { bucket: string, value: number}) =>
            ({ _type: "Value", account: bucket, value: value })
          )(splits)
        , remainder: remainder
      }))
  );
}

export const removeRule = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (ruleId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      UserArena.virtual(pool)(log)(arena)
    , TE.chain((virtual) => RuleFrontend.deleteById(pool)(log)(arena.user.id)(virtual.account.id)(ruleId))
    , TE.map(() => {})
  );
}

export const removeIntegration = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (integrationId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      IntegrationFrontend.deleteById(pool)(log)(arena.user.id)(integrationId)
    , TE.map(() => {})
  );
}

export const removeAccount = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (accountId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.Do
    , TE.bind("physicalAccount", () => resolveUserAccount(pool)(log)(arena)("physical"))
    , TE.bind("account", () => AccountFrontend.getByIdAndUserId(pool)(log)(arena.user.id)(accountId))
    , TE.bind("validate", ({ physicalAccount, account }) => {
        if (pipe(account.parentId, O.map((parentId) => parentId === physicalAccount.account.id), O.getOrElse(() => false))) {
          return TE.of(true)
        } else {
          return TE.throwError(Exception.throwValidationError(`${accountId} is not a physical account`))
        }
      })
    , TE.bind("deleteSource", ({ account }) => {
        return <TE.TaskEither<Exception.t, any>> pipe(
            account.metadata.sourceId
          , O.map(removeSource(pool)(log)(arena))
          , O.getOrElse(() => TE.of({}))
        );
      })
    , TE.bind("deleteAccount", () => AccountFrontend.deleteById(pool)(log)(arena.user.id)(accountId))
    , TE.map(() => {})
  );
}

export const removeBucket = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (bucketId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      TE.Do
    , TE.bind("virtualAccount", () => resolveUserAccount(pool)(log)(arena)("virtual"))
    , TE.bind("account", () => AccountFrontend.getByIdAndUserId(pool)(log)(arena.user.id)(bucketId))
    , TE.bind("validate", ({ virtualAccount, account }) => {
        if (pipe(account.parentId, O.map((parentId) => parentId === virtualAccount.account.id), O.getOrElse(() => false))) {
          return TE.of(true)
        } else {
          return TE.throwError(Exception.throwValidationError(`${bucketId} is not a virtual account`))
        }
      })
    , TE.bind("materialized", () => UserArena.materializeVirtual(pool)(log)(arena))
    , TE.bind("validateEmpty", ({ materialized }) => {
        if (materialized.tagged[bucketId].transactions.length == 0) {
          return TE.of(true);
        } else {
          return TE.throwError(Exception.throwBadRequest(`Bucket ${bucketId} is not empty`));
        }
      })
    , TE.bind("virtualRules", () => UserArena.virtualRules(pool)(log)(arena))
    , TE.bind("validateNoRules", ({ virtualRules }) => {
        const accounts = pipe(
            virtualRules
          , A.map((rule) => rule.rule)
          , A.filterMap(Rule.Internal.collectSplit)
          , A.chain(Rule.Internal.Split.collectAccounts)
        );
        const references = pipe(accounts, A.filter((account) => account == bucketId));
        if (references.length == 0) {
          return TE.of(true);
        } else {
          return TE.throwError(Exception.throwBadRequest(`Bucket ${bucketId} is referenced by rules`));
        }
      })
    , TE.bind("delete", () => AccountFrontend.deleteById(pool)(log)(arena.user.id)(bucketId))
    , TE.map(() => {})
  );
}

export const removeTemplate = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (templateId: string): TE.TaskEither<Exception.t, any> => {
  return pipe(
      TemplateFrontend.deleteById(pool)(log)(arena.user.id)(templateId)
    , TE.map(() => {})
  );
}

export const removeSource = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (sourceId: string): TE.TaskEither<Exception.t, any> => {
  return pipe(
      SourceFrontend.deleteById(pool)(log)(arena.user.id)(sourceId)
    , TE.map(() => {})
  );
}

export const removeTransaction = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (transactionId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      TransactionFrontend.deleteById(pool)(log)(arena.user.id)(transactionId)
    , TE.map(() => {})
  );
}

export const ackNotification = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (notificationId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      NotificationFrontend.ack(pool)(log)(arena.user.id)(notificationId)
    , TE.map(() => {})
  );
}

export const removeNotification = (pool: Pool) => (log : Logger) => (arena: UserArena.t) => (notificationId: string): TE.TaskEither<Exception.t, void> => {
  return pipe(
      NotificationFrontend.deleteById(pool)(log)(arena.user.id)(notificationId)
    , TE.map(() => {})
  );
}

export const createManualAccount =
  (pool: Pool) =>
  (log : Logger) =>
  (arena: UserArena.t) =>
  (name: string): TE.TaskEither<Exception.t, { account: Account.Internal.t, source: Source.Internal.t }> => {
  log.info(`[${arena.id}] - building source + account`);

  return pipe(
      <Source.Frontend.Create.t>{
          id: UserArena.idFor(arena)(`source_${name}`)
        , userId: arena.user.id
        , name: name
        , integrationId: O.none
        , tag: UserArena.idFor(arena)(`tag_${name}`)
      }
    , SourceFrontend.create(pool)(log)
    , TE.chain((source) => pipe(createAccount(pool)(log)(arena)(source), TE.map((account) => ({ account: account, source: source }))))
    , TE.map((both) => {
        log.info(`[${arena.id}] - source + account built`);
        return both;
      })
  );
}

export const createTransaction =
  (pool: Pool) =>
  (log : Logger) =>
  (arena: UserArena.t) =>
  (transaction: Transaction.Arena.Create.t, id : string = "transaction"): TE.TaskEither<Exception.t, Transaction.Internal.t> => {
  return pipe(
      SourceFrontend.getById(pool)(log)(arena.user.id)(transaction.sourceId)
    , TE.mapLeft(() => Exception.throwValidationError(`Source '${transaction.sourceId}' not found`))
    , TE.chain(() => TransactionFrontend.create(pool)(log)({ ...transaction, id: UserArena.idFor(arena)(id), userId: arena.user.id }))
  );
}

export const createIntegration =
  (pool: Pool) =>
  (log : Logger) =>
  (plaidClient: PlaidApi) =>
  (arena: UserArena.t) =>
  (request: { institutionName: string, accounts: { id: string, name: string }[] }) =>
  (publicToken: { item_id: string, access_token: string }): TE.TaskEither<Exception.t, void> => {
  const user = arena.user;

  log.info(`[${arena.id}] - building integration/sources`);

  const buildIntegration = (): TE.TaskEither<Exception.t, Integration.Internal.t> => {
    log.info(`[${arena.id}] - building integration "${request.institutionName}"`);
    const integration: Integration.Frontend.Create.t = {
        id: UserArena.idFor(arena)(`integration_${request.institutionName}`)
      , userId: user.id
      , name: request.institutionName
      , credentials: { _type: "Plaid", itemId: publicToken.item_id, accessToken: publicToken.access_token }
    };

    return IntegrationFrontend.create(pool)(log)(integration);
  }

  const buildSources = (integration: Integration.Internal.t): TE.TaskEither<Exception.t, Context[]> => {
    log.info(`[${arena.id}] - building sources "${request.accounts}"`);
    const sources: Source.Frontend.Create.t[] = A.map(({ id, name }: Plaid.External.Request.ExchangePublicToken.Account) => {
      return <Source.Frontend.Create.t>{
          id: UserArena.idFor(arena)(`source_${name}`)
        , userId: user.id
        , name: name
        , integrationId: O.some(integration.id)
        , tag: id
      };
    })(request.accounts);

    return pipe(
        sources
      , A.map((source) => {
          return pipe(
              source
            , SourceFrontend.create(pool)(log)
            , TE.map((source) => (<Context>{ source: source, integration: integration }))
          );
        })
      , A.sequence(TE.ApplicativeSeq)
    );
  }

  const buildAccounts = (contexts: Context[]): TE.TaskEither<Exception.t, Context[]> => {
    return pipe(
        contexts
      , A.map(({ source }) => source)
      , A.map(createAccount(pool)(log)(arena))
      , A.sequence(TE.ApplicativeSeq)
      , TE.map(() => contexts)
    );
  }

  const rollupAll = (contexts: Context[]): TE.TaskEither<Exception.t, void> => {
    return pipe(
        contexts
      , A.map(rollupFor(pool)(log)(plaidClient)(arena.id))
      , A.sequence(TE.ApplicativeSeq)
      , TE.map(() => {})
      , TE.mapLeft(Exception.throwInternalError)
    );
  }

  return pipe(
      buildIntegration()
    , TE.chain(buildSources)
    , TE.chain(buildAccounts)
    , TE.chain(rollupAll)
    , TE.map(() => {
        log.info(`[${arena.id}] - integration/sources built`);
      })
  );
}
