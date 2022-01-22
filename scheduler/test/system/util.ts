import crypto from "crypto";
import { pipe } from "fp-ts/lib/pipeable";
import fetch, { Response } from "node-fetch";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

export const uuid = (): string => crypto.randomUUID();

export class System {
  constructor(readonly host: string = "localhost", readonly port: string = "3002") {}

  addSource(name: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask("/sources/")("POST")(O.some({ name: name, userId: userId }))
      , TE.chain(this.json)
    );
  }

  getSource(id: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/sources/${id}?userId=${userId}`)("GET")()
      , TE.chain(this.json)
    );
  }

  listSources(userId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/sources?userId=${userId}`)("GET")()
      , TE.chain(this.json)
    );
  }

  deleteSource(id: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/sources/${id}?userId=${userId}`)("DELETE")()
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
