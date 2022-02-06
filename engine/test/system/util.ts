import crypto from "crypto";
import { pipe } from "fp-ts/lib/pipeable";
import fetch, { Response } from "node-fetch";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { Account } from "model";
import { Rule } from "model";
import { Transaction } from "model";

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
  constructor(readonly host: string = "localhost", readonly port: string = "3000") {}

  addTransaction(
      sourceId: string
    , userEmail: string
    , amount: number
    , merchantName: string
    , description: string
    , authorizedAt: Date
    , capturedAt: O.Option<Date>
    , metadata: any
  ): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/transactions?userEmail=${userEmail}`)("POST")(O.some({
            sourceId: sourceId
          , amount: amount
          , merchantName: merchantName
          , description: description
          , authorizedAt: authorizedAt.getTime()
          , capturedAt: O.map((capturedAt: Date) => capturedAt.getTime())(capturedAt)
          , metadata: metadata
        }))
      , TE.chain(this.json)
    );
  }

  listTransactions(userEmail: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/transactions?userEmail=${userEmail}`)("GET")()
      , TE.chain(this.json)
    );
  }

  addAccount(name: string, parentId: O.Option<string> = O.none, userEmail: string = "test"): TE.TaskEither<Error, any> {
    const resolvedParentId = O.match(
        () => ""
      , (parentId: string) => `&parentId=${parentId}`
    )(parentId);

    return pipe(
        this.fetchTask(`/accounts?userEmail=${userEmail}${resolvedParentId}`)("POST")(O.some({ name: name }))
      , TE.chain(this.json)
    );
  }

  listAccounts(userEmail: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/accounts?userEmail=${userEmail}`)("GET")()
      , TE.chain(this.json)
    );
  }

  deleteAccount(id: string, userEmail: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/accounts/${id}?userEmail=${userEmail}`)("DELETE")()
      , TE.chain(this.json)
    );
  }

  addRule(accountId: string, rule: any): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask("/rules/")("POST")(O.some({ accountId: accountId, rule: rule }))
      , TE.chain(this.json)
    );
  }

  listRules(accountId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/rules?accountId=${accountId}`)("GET")()
      , TE.chain(this.json)
    );
  }

  deleteRule(id: string, accountId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/rules/${id}?accountId=${accountId}`)("DELETE")()
      , TE.chain(this.json)
    );
  }

  materialize(accountId: string, userId: string = "test"): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/accounts/${accountId}/materialize?userId=${userId}`)("GET")()
      , TE.chain(this.json)
    );
  }

  private fetchTask = (uri: string) => (method: string) => (body: O.Option<any> = O.none): TE.TaskEither<Error, Response> => {
    const resolved = O.match(
      () => { return {}; },
      (body) => { return { body: JSON.stringify(body) }; }
    )(body);

    return TE.tryCatch(
        () => fetch(
            `http://${this.host}:${this.port}/channel${uri}`
          , { method: method, ...resolved, headers: { "Content-Type": "application/json" } }
        )
      , E.toError
    );
  };

  private json = (res: Response): TE.TaskEither<Error, any> => {
    return TE.tryCatch(
        () => res.json()
      , E.toError
    );
  };
}
