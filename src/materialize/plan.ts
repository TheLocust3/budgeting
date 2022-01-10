import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';

import * as Account from '../model/account';
import * as Rule from '../model/rule';
import { Array } from '../model/util';

export type Stage = {
  include: Rule.Internal.Include[]
}

export type t = {
  stages: Stage[]
}

const buildStage = (rulesWrapper: Rule.Internal.t[]): Stage => {
  const rules = A.map((rule: Rule.Internal.t) => rule.rule)(rulesWrapper);

  const include = pipe(rules, A.map(Rule.Internal.collectInclude), Array.flattenOption);

  return {
    include: include
  };
}

export const build = (account: Account.Internal.t): t => {
  return { stages: [buildStage(account.rules)] };
}