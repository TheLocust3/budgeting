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

export class System {
  constructor(readonly host: string = 'localhost', readonly port: string = '3000') {}

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
