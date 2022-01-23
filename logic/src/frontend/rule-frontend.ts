import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import EngineChannel from '../channel/engine-channel';
import { Channel } from '../channel/util';

import { Rule } from "model";
import { Exception } from "magic";

export namespace RuleFrontend {
  export const all = (accountId: string): TE.TaskEither<Exception.t, Rule.Internal.t[]> => {
    return pipe(
        EngineChannel.push(`/rules?accountId=${accountId}`)('GET')()
      , TE.map((response) => response.rules)
      , Channel.toArrayOf(Rule.Channel.Response.from)
    );
  };

  export const getById = (accountId: string) => (id: string): TE.TaskEither<Exception.t, Rule.Internal.t> => {
    return pipe(
        EngineChannel.push(`/rules/${id}?accountId=${accountId}`)('GET')()
      , Channel.to(Rule.Channel.Response.from)
    );
  };

  export const create = (rule: Rule.Internal.t): TE.TaskEither<Exception.t, Rule.Internal.t> => {
    return pipe(
        EngineChannel.push(`/rules/`)('POST')(O.some(Rule.Channel.Request.to(rule)))
      , Channel.to(Rule.Channel.Response.from)
    );
  };

  export const deleteById = (accountId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        EngineChannel.push(`/rules/${id}?accountId=${accountId}`)('DELETE')()
      , Channel.toVoid
    );
  };
}

export default RuleFrontend;
