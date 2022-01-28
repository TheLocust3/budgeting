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

  addIntegration(name: string, userId: string, credentials: any): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask("/integrations/")("POST")(O.some({ name: name, userId: userId, credentials: credentials }))
      , TE.chain(this.json)
    );
  }

  getIntegration(id: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/integrations/${id}?userId=${userId}`)("GET")()
      , TE.chain(this.json)
    );
  }

  listIntegrations(userId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/integrations?userId=${userId}`)("GET")()
      , TE.chain(this.json)
    );
  }

  deleteIntegration(id: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask(`/integrations/${id}?userId=${userId}`)("DELETE")()
      , TE.chain(this.json)
    );
  }

  addSource(name: string, userId: string): TE.TaskEither<Error, any> {
    return pipe(
        this.fetchTask("/sources/")("POST")(O.some({ name: name, userId: userId, integrationId: O.none }))
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
