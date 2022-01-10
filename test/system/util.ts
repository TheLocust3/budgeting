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

export class System {
  constructor(readonly host: string = 'localhost', readonly port: string = '3000') {}

  addGroup(name: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask('/groups/')('POST')({ name: name })
      , TE.chain(this.json)
    );
  }

  getGroup(id: string): TE.TaskEither<Error, any> {
    return this.fetchTask(`/groups/${id}`)('GET')();
  }

  listGroups(): TE.TaskEither<Error, any> {
    return this.fetchTask(`/groups/`)('GET')();
  }

  deleteGroup(id: string): TE.TaskEither<Error, any> {
    return this.fetchTask(`/groups/`)('DELETE')();
  }

  private fetchTask = (uri: string) => (method: string) => (body: any = {}): TE.TaskEither<Error, Response> => {
    return TE.tryCatch(
        () => fetch(
            `http://${this.host}:${this.port}${uri}`
          , { method: method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
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
