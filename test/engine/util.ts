import crypto from "crypto";
import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
import fetch, { Response } from "node-fetch";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { Materialize, Validate } from "../../src/engine";

import { Pipe } from "../../src/magic";
import { Account, Rule, Transaction } from "../../src/model";
import { AccountFrontend, TransactionFrontend, RuleFrontend, UserFrontend } from "../../src/storage";

const pool = new Pool();

export const uuid = (): string => crypto.randomUUID();

export namespace RuleBuilder {
  export const and = (left: any, right: any) => {
    return { _type: "And", left: left, right: right };
  };

  export const not = (clause: any) => {
    return { _type: "Not", clause: clause };
  };

  export const stringMatch = (field: string, operator: string, value: string) => {
    return { _type: "StringMatch", field: field, operator: operator, value: value };
  };

  export const numberMatch = (field: string, operator: string, value: number) => {
    return { _type: "NumberMatch", field: field, operator: operator, value: value };
  };

  export const exists = (field: string) => {
    return { _type: "Exists", field: field };
  };

  export const stringGlob = (field: string, value: string) => {
    return { _type: "StringGlob", field: field, value: value };
  };

  export const attach = (clause: any, field: string, value: string) => {
    return { _type: "Attach", where: clause, field: field, value: value };
  };

  export const percent = (account: string, percent: number) => {
    return { _type: "Percent", account: account, percent: percent };
  };

  export const value = (account: string, value: number) => {
    return { _type: "Value", account: account, value: value };
  };

  export const splitByPercent = (clause: any, splits: any[]) => {
    return { _type: "SplitByPercent", where: clause, splits: splits };
  };

  export const splitByValue = (clause: any, splits: any[], remainder: any) => {
    return { _type: "SplitByValue", where: clause, splits: splits, remainder: remainder };
  };

  export const include = (clause: any) => {
    return { _type: "Include", where: clause };
  };
}

export namespace MetadataBuilder {
  export const plaid = { _type: "Plaid", };
}

export type JsonTransaction = {
    sourceId: string
  , userId: string
  , amount: number
  , merchantName: string
  , description: string
  , authorizedAt: Date
  , capturedAt: O.Option<Date>
  , metadata: any
}

export const defaultTransaction: JsonTransaction = {
    sourceId: "sourceId"
  , userId: "test"
  , amount: 10
  , merchantName: "merchant name"
  , description: "description"
  , authorizedAt: new Date()
  , capturedAt: O.none
  , metadata: MetadataBuilder.plaid
};

export const addTransaction = (system: System) => ({
      sourceId
    , userId
    , amount
    , merchantName
    , description
    , authorizedAt
    , capturedAt
    , metadata
  }: JsonTransaction = defaultTransaction): TE.TaskEither<Error, any> => {
  return system.addTransaction(
      sourceId
    , userId
    , amount
    , merchantName
    , description
    , authorizedAt
    , capturedAt
    , metadata
  );
};

export class System {
  createTestUser(): Promise<string> {
    return pipe(
        UserFrontend.create(pool)({ email: "test", password: "foobar", role: "user" })
      , TE.map((user) => user.id)
      , Pipe.toPromise
    );
  }

  addTransaction(
      sourceId: string
    , userId: string
    , amount: number
    , merchantName: string
    , description: string
    , authorizedAt: Date
    , capturedAt: O.Option<Date>
    , metadata: any
  ): TE.TaskEither<Error, any> {
    return pipe(TransactionFrontend.create(pool)(<Transaction.Internal.t> {
        id: uuid()
      , sourceId: sourceId
      , userId: userId
      , amount: amount
      , merchantName: merchantName
      , description: description
      , authorizedAt: authorizedAt
      , capturedAt: capturedAt
      , metadata: metadata
    }), TE.mapLeft(E.toError));
  }

  getTransaction(id: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(TransactionFrontend.getById(pool)(userId)(id), TE.mapLeft(E.toError));
  }

  listTransactions(userId: string): TE.TaskEither<Error, any> {
    return pipe(TransactionFrontend.all(pool)(userId), TE.mapLeft(E.toError));
  }

  deleteTransaction(id: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(TransactionFrontend.deleteById(pool)(userId)(id), TE.mapLeft(E.toError));
  }

  addAccount(name: string, parentId: O.Option<string> = O.none, userId: string): TE.TaskEither<Error, any> {
    return pipe(AccountFrontend.create(pool)({
        parentId: parentId
      , userId: userId
      , name: name
    }), TE.mapLeft(E.toError));
  }

  getAccount(id: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(AccountFrontend.getByIdAndUserId(pool)(userId)(id), TE.mapLeft(E.toError));
  }

  listAccounts(userId: string): TE.TaskEither<Error, any> {
    return pipe(AccountFrontend.all(pool)(userId), TE.mapLeft(E.toError));
  }

  deleteAccount(id: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(AccountFrontend.deleteById(pool)(userId)(id), TE.mapLeft(E.toError));
  }

  addRule(accountId: string, rule: any, userId: string): TE.TaskEither<Error, any> {
    return pipe(
        { accountId: accountId , userId: userId , rule: rule }
      , Validate.rule(pool)
      , TE.chain(RuleFrontend.create(pool))
      , TE.mapLeft(E.toError)
    );
  }

  getRule(id: string, accountId: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(RuleFrontend.getById(pool)(userId)(accountId)(id), TE.mapLeft(E.toError));
  }

  listRules(accountId: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(RuleFrontend.getByAccountId(pool)(userId)(accountId), TE.mapLeft(E.toError));
  }

  deleteRule(id: string, accountId: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(RuleFrontend.deleteById(pool)(userId)(accountId)(id), TE.mapLeft(E.toError));
  }

  materialize(accountId: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(Materialize.account(pool)(userId)(accountId), TE.mapLeft(E.toError));
  }
}
