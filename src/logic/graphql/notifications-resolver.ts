import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import * as graphql from "graphql";

import * as Context from './context';
import * as Types from './types';

import { UserArena } from "../../user";

import { Notification } from "../../model";
import { Exception, Pipe } from "../../magic";

const transform = (notification : Notification.Internal.t): Types.Notification.t => {
  return { ...notification, createdAt: notification.createdAt.getTime() }
}

const resolve = (source: any, args: any, context: Context.t): Promise<Types.Notification.t[]> => {
  return pipe(
      UserArena.notifications(context.pool)(context.arena)
    , TE.map(A.map(transform))
    , Pipe.toPromise
  );
}

export const t = {
    type: new graphql.GraphQLNonNull(new graphql.GraphQLList(Types.Notification.t))
  , resolve: resolve
}
