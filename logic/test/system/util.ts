import crypto from 'crypto';
import { pipe } from 'fp-ts/lib/pipeable';
import fetch, { Response } from 'node-fetch';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

export const uuid = (): string => crypto.randomUUID()

export class System {
  private token: O.Option<string> = O.none;

  constructor(readonly host: string = 'localhost', readonly port: string = '3001') {}

  addUser(email: string, password: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask('/users/')('POST')(O.some({ email: email, password: password }))
      , TE.chain(this.json)
    );
  }

  addSource(userId: string, name: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask('/sources/')('POST')(O.some({ userId: userId, name: name }))
      , TE.chain(this.json)
    );
  }

  getSource(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/sources/${id}`)('GET')()
      , TE.chain(this.json)
    );
  }

  listSources(): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/sources`)('GET')()
      , TE.chain(this.json)
    );
  }

  deleteSource(id: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/sources/${id}`)('DELETE')()
      , TE.chain(this.json)
    );
  }

  login(email: string, password: string): TE.TaskEither<Error, any> {
    console.log("WAHT")
    return pipe(
        this.fetchTask(`/users/login`)('POST')(O.some({ email: email, password: password }))
      , TE.chain(this.json)
      , TE.map((token) => {
          if ('token' in token) {
            this.token = O.some(String(token.token));
          } else {
            this.token = O.some('');
          }

          return token;
        })
    );
  }

  private fetchTask = (uri: string) => (method: string) => (body: O.Option<any> = O.none): TE.TaskEither<Error, Response> => {
    const resolved = O.match(
      () => { return {}; },
      (body) => { return { body: JSON.stringify(body) }; }
    )(body);

    const authorization = O.match(
      () => { return {}; },
      (token: string) => { return { Authorization: token }; }
    )(this.token);

    return TE.tryCatch(
        () => fetch(
            `http://${this.host}:${this.port}${uri}`
          , { method: method, ...resolved, headers: { 'Content-Type': 'application/json', ...authorization } }
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
