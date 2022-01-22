import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/lib/pipeable';
import * as iot from 'io-ts';

import UserFrontend from '../frontend/user-frontend';

import { User } from 'model';
import { Exception } from 'magic';

export namespace JWT {
  namespace Payload {
    export const t = iot.type({
      userId: iot.string
    });
    export type t = iot.TypeOf<typeof t>

    export const from = (request: any): E.Either<Exception.t, t> => {
      return pipe(
          request
        , t.decode
        , E.mapLeft((_) => Exception.throwMalformedJson)
      );
    }
  }

  export const sign = (user: User.Internal.t): string => {
    const userId = pipe(user.id, O.getOrElse(() => ""))
    const payload: Payload.t = { userId: userId };
    return jwt.sign(payload, 'secret'); // TODO: JK
  }

  export const verify = (pool: Pool) => (token: string): TE.TaskEither<Exception.t, User.Internal.t> => {
    return pipe(
        jwt.verify(token, 'secret') // TODO JK
      , Payload.from
      , TE.fromEither
      , TE.chain(({ userId }) => UserFrontend.getById(pool)(userId))
    );
  }
}