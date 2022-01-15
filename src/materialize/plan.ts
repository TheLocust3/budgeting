import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';

import * as Account from '../model/account';
import * as Rule from '../model/rule';
import { Array } from '../model/util';

export type Stage = {
    include: Rule.Internal.Include[]
  , update: Rule.Internal.Update[]
}

export type t = {
  stages: Stage[]
}

const buildStage = (rulesWrapper: Rule.Internal.t[]): Stage => {
  const rules = A.map((rule: Rule.Internal.t) => rule.rule)(rulesWrapper);

  const include = pipe(rules, A.map(Rule.Internal.collectInclude), Array.flattenOption);
  const update = pipe(rules, A.map(Rule.Internal.collectUpdate), Array.flattenOption);

  return {
      include: include
    , update: update
  };
}

export const build = (accounts: Account.Internal.t[]): t => {
  return { stages: A.map((account: Account.Internal.t) => buildStage(account.rules))(accounts) };
}