import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';

import * as Account from '../model/account';
import * as Rule from '../model/rule';
import { Array } from '../model/util';

export type Stage = {
  select: Rule.Internal.Select[],
  attach: Rule.Internal.Attach[]
}

export type t = {
  stages: Stage[]
}

const buildStage = (rulesWrapper: Rule.Internal.t[]): Stage => {
  const rules = A.map((rule: Rule.Internal.t) => rule.rule)(rulesWrapper);

  const select = pipe(rules, A.map(Rule.Internal.collectSelect), Array.flattenOption);
  const attach = pipe(rules, A.map(Rule.Internal.collectAttach), Array.flattenOption);

  return {
      select: select
    , attach: attach
  };
}

export const build = (account: Account.Internal.t): t => {
  return { stages: [buildStage(account.rules)] };
}