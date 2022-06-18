import * as graphql from "graphql";

import * as Context from './context';
import * as Types from './types';

import { User } from "../../model";

export const t = {
    type: new graphql.GraphQLNonNull(Types.User.t)
  , resolve: (source: any, args: any, context: Context.t) => context.arena.user
}