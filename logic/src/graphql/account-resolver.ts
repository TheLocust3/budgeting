import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

// TODO: JK
/*const resolveUser = (request: Express.Request) => (id: string): TE.TaskEither<Exception.t, User.Internal.t> => {
  const context: Context = request.context;
  const pool: Pool = request.app.locals.db;

  return O.match(
      () => UserFrontend.getById(pool)(id)
    , (user: User.Internal.t) => TE.of(user)
  )(context.user);
}

const resolveUserField = (field: UserField) => (source: any, args: any, request: Express.Request): Promise<string> => {
  const user: User.Internal.t = request.user;

  return pipe(
      resolveUser(request)(user.id)
    , TE.map((user) => user[field])
    , toPromise
  );
}*/