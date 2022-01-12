import crypto from 'crypto';
import { pipe } from 'fp-ts/lib/pipeable';
import fetch, { Response } from 'node-fetch';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import * as Group from '../../src/model/group';
import * as Account from '../../src/model/account';
import * as Rule from '../../src/model/rule';
import * as Transaction from '../../src/model/transaction';

export const uuid = (): string => crypto.randomUUID()

export namespace RuleBuilder {
  export const and = (left: any, right: any) => {
    return { _type: "And", left: left, right: right };
  }

  export const not = (clause: any) => {
    return { _type: "Not", clause: clause };
  }

  export const match = (field: string, operator: string, value: string) => {
    return { _type: "Match", field: field, operator: operator, value: value };
  }

  export const include = (clause: any) => {
    return { _type: "Include", clause: clause };
  }
}

export namespace MetadataBuilder {
  export const plaid = { _type: "Plaid", };
}

// akin to a war crime
export const unwrap = (task: TE.TaskEither<Error, any>): Promise<any> => {
  return TE.match(
      (err) => { throw new Error(String(err)) }
    , (obj) => obj
  )(task)()
}

export class System {
  constructor(readonly host: string = 'localhost', readonly port: string = '3000') {}

  addTransaction(
      sourceId: string
    , amount: number
    , merchantName: string
    , description: string
    , authorizedAt: Date
    , capturedAt: O.Option<Date>
    , metadata: any
  ): TE.TaskEither<Error, any> {
    const resolvedCapturedAt = O.match(
        () => { return {}; }
      , (capturedAt: Date) => { return { capturedAt: capturedAt.getTime() }; }
    )(capturedAt);

    return pipe(
        this.fetchTask('/transactions/')('POST')(O.some({
            sourceId: sourceId
          , amount: amount
          , merchantName: merchantName
          , description: description
          , authorizedAt: authorizedAt.getTime()
          , ...resolvedCapturedAt
          , metadata: metadata
        }))
      , TE.chain(this.json)
    );
  }

  getTransaction(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/transactions/${id}`)('GET')()
      , TE.chain(this.json)
    );
  }

  listTransactions(): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/transactions/`)('GET')()
      , TE.chain(this.json)
    );
  }

  deleteTransaction(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/transactions/${id}`)('DELETE')()
      , TE.chain(this.json)
    );
  }

  addGroup(name: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask('/groups/')('POST')(O.some({ name: name }))
      , TE.chain(this.json)
    );
  }

  getGroup(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/groups/${id}`)('GET')()
      , TE.chain(this.json)
    );
  }

  listGroups(): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/groups/`)('GET')()
      , TE.chain(this.json)
    );
  }

  deleteGroup(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/groups/${id}`)('DELETE')()
      , TE.chain(this.json)
    );
  }

  addAccount(groupId: string, name: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask('/accounts/')('POST')(O.some({ groupId: groupId, name: name }))
      , TE.chain(this.json)
    );
  }

  getAccount(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/accounts/${id}`)('GET')()
      , TE.chain(this.json)
    );
  }

  listAccounts(groupId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/accounts?groupId=${groupId}`)('GET')()
      , TE.chain(this.json)
    );
  }

  deleteAccount(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/accounts/${id}`)('DELETE')()
      , TE.chain(this.json)
    );
  }

  addRule(accountId: string, rule: any): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask('/rules/')('POST')(O.some({ accountId: accountId, rule: rule }))
      , TE.chain(this.json)
    );
  }

  getRule(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/rules/${id}`)('GET')()
      , TE.chain(this.json)
    );
  }

  listRules(accountId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/rules?accountId=${accountId}`)('GET')()
      , TE.chain(this.json)
    );
  }

  deleteRule(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/rules/${id}`)('DELETE')()
      , TE.chain(this.json)
    );
  }

  materialize(accountId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/accounts/${accountId}/materialize`)('GET')()
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
            `http://${this.host}:${this.port}${uri}`
          , { method: method, ...resolved, headers: { 'Content-Type': 'application/json' } }
        )
      , E.toError
    );
  }

  private json = (res: Response): TE.TaskEither<Error, any> => {
    return TE.tryCatch(
        () => res.json()
      , E.toError
    );
  }
}
