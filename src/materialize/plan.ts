import * as Account from '../model/account';
import * as Rule from '../model/rule';

import * as A from 'fp-ts/Array';

type Stage = {
  select: Rule.Internal.Select[],
  attach: Rule.Internal.Attach[]
}

export type t = {
  stages: Stage[]
}

const buildStage = (rulesWrapper: Rule.Internal.t[]): Stage => {
  const rules = A.map((rule: Rule.Internal.t) => rule.rule)(rulesWrapper);

  // TODO: JK yeehaw
  const select = <Rule.Internal.Select[]> A.filter(Rule.Internal.isSelect)(rules);
  const attach = <Rule.Internal.Attach[]> A.filter(Rule.Internal.isAttach)(rules);

  return {
    select: select,
    attach: attach
  };
}

export const build = (account: Account.Internal.t): t => {
  return { stages: [buildStage(account.rules)] };
}