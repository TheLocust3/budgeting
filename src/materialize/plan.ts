import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';

import * as Account from '../model/account';
import * as Rule from '../model/rule';
import { Array } from '../model/util';

export type Stage = {
    tag: string
  , attach: Rule.Internal.Attach.t[]
  , split: Rule.Internal.Split.t[]
}

export type t = {
  stages: Stage[]
}

const buildStage = (accountId: string) => (rulesWrapper: Rule.Internal.t[]): Stage => {
  const rules = A.map((rule: Rule.Internal.t) => rule.rule)(rulesWrapper);

  const attach = pipe(rules, A.map(Rule.Internal.collectAttach), Array.flattenOption);
  const split = pipe(rules, A.map(Rule.Internal.collectSplit), Array.flattenOption);

  return {
      tag: accountId
    , attach: attach
    , split: split
  };
}

export const build = (accounts: Account.Internal.t[]): t => {
  const stages = A.map((account: Account.Internal.t) => {
    const accountId = O.match(() => "", (account: string) => account)(account.id) // TODO: JK should really have a strict "Materialize" Account type
    return buildStage(accountId)(account.rules);
  })(accounts);
  
  return { stages: stages };
}