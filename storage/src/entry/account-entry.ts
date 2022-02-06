import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as iot from "io-ts";
import * as types from "io-ts-types";

import { Entry } from "./entry";
import { UserEntry } from "./user-entry";
import { rootPath, hash, passthrough, Writers, orNotFound } from "./util";

import { Account, Rule } from "model";
import { Exception, Format, Pipe } from "magic";

export namespace AccountEntry {
  namespace Storage {
    const t = iot.type({
      accounts: iot.array(Account.Internal.t)
    });

    export type t = iot.TypeOf<typeof t>
    export const Json = new Format.JsonFormatter(t);
  }

  const entry = new Entry(passthrough, { root: rootPath, name: "accounts", format: Storage.Json });

  const storageWriter = Writers.orDefaultWriter<Storage.t>({ accounts: []});

  const mapAccount =
    (map: (account: Account.Internal.t) => O.Option<Account.Internal.t>) =>
    (accounts: Account.Internal.t[]): Account.Internal.t[] => {
    return pipe(
        accounts
      , A.map((account: Account.Internal.t) => {
          const outAccount = map(account);

          return pipe(
              map(account)
            , O.map((outAccount: Account.Internal.t) => {
                return { ...outAccount, children: mapAccount(map)(outAccount.children) };
              })
          );
        })
      , Pipe.flattenOption
    );
  }

  const findAccount =
    (id: string) =>
    (accounts: Account.Internal.t[]): O.Option<Account.Internal.t> => {
      return pipe(
          accounts
        , A.findFirst((account: Account.Internal.t) => account.id === id)
        , O.match(
              () => pipe(accounts, A.map((account: Account.Internal.t) => account.children), A.flatten, findAccount(id))
            , (account: Account.Internal.t) => O.some(account)
          )
      );
    }

  export const allByUser = (userEmail: string): TE.TaskEither<Exception.t, Account.Internal.t[]> => {
    const objectId = UserEntry.idFor(userEmail);

    return pipe(
        entry.getObject(objectId)
      , TE.map((stored) => stored.accounts)
    );
  }

  export const byId = (userEmail: string) => (id: string): TE.TaskEither<Exception.t, Account.Internal.t> => {
    const objectId = UserEntry.idFor(userEmail);

    return pipe(
        entry.getObject(objectId)
      , TE.map((stored: Storage.t) => findAccount(id)(stored.accounts))
      , orNotFound
    );
  }

  export const insertRule =
    (userEmail: string) =>
    (accountId: string) =>
    (rule: Rule.Internal.t): TE.TaskEither<Exception.t, Rule.Internal.t> => {
    const objectId = UserEntry.idFor(userEmail);
    const writer = storageWriter((saved: Storage.t) => {
      const accounts = mapAccount((maybeAccount) => {
        if (maybeAccount.id === accountId) {
          const rules = A.filter((maybeRule: Rule.Internal.t) => maybeRule.id !== rule.id)(maybeAccount.rules);
          rules.push(rule);

          return O.some({ ...maybeAccount, rules: rules });
        } else {
          return O.some(maybeAccount);
        }
      })(saved.accounts);

      return { accounts: accounts };
    })

    return pipe(
        entry.putObject(objectId)(writer)
      , TE.map(() => rule)
    );
  }

  export const deleteRuleById =
    (userEmail: string) =>
    (accountId: string) =>
    (ruleId: string): TE.TaskEither<Exception.t, void> => {
    const objectId = UserEntry.idFor(userEmail);
    const writer = storageWriter((saved: Storage.t) => {
      const accounts = mapAccount((maybeAccount) => {
        if (maybeAccount.id === accountId) {
          const rules = A.filter((maybeRule: Rule.Internal.t) => maybeRule.id !== ruleId)(maybeAccount.rules);

          return O.some({ ...maybeAccount, rules: rules });
        } else {
          return O.some(maybeAccount);
        }
      })(saved.accounts);

      return { accounts: accounts };
    })

    return pipe(
        entry.putObject(objectId)(writer)
      , TE.map(() => {})
    );
  }

  export const insert =
    (userEmail: string) =>
    (parentId: O.Option<string>) =>
    (account: Account.Internal.t): TE.TaskEither<Exception.t, Account.Internal.t> => {
    const objectId = UserEntry.idFor(userEmail);
    const writer = storageWriter((saved: Storage.t) => {
      return O.match(
          () => { return { accounts: A.append(account)(saved.accounts) }; }
        , (parentId: string) => {
            const accounts = mapAccount((maybeParent) => {
              if (maybeParent.id === parentId) {
                return O.some({ ...maybeParent, children: A.append(account)(maybeParent.children) });
              } else {
                return O.some(maybeParent);
              }
            })(saved.accounts);

            return { accounts: accounts };
          }
      )(parentId);
    })

    return pipe(
        entry.putObject(objectId)(writer)
      , TE.map(() => account)
    );
  }

  export const deleteById = (userEmail: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    const objectId = UserEntry.idFor(userEmail);
    const writer = storageWriter((saved: Storage.t) => {
      const accounts = mapAccount((account) => {
        if (account.id === id) {
          return O.none;
        } else {
          return O.some(account);
        }
      })(saved.accounts);

      return { accounts: accounts };
    })

    return pipe(
        entry.putObject(objectId)(writer)
      , TE.map(() => {})
    );
  }
}
