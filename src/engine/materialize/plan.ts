import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";

import { Account, Rule } from "../../model";
import { Pipe } from "../../magic";

export type SplitStage = {
    _type: "SplitStage"
  , tag: string
  , attach: Rule.Internal.Attach.t[]
  , split: Rule.Internal.Split.t[]
}

export type IncludeStage = {
    _type: "IncludeStage"
  , tag: string
  , attach: Rule.Internal.Attach.t[]
  , include: Rule.Internal.Include.t[]
  , children: string[]
}

export type Stage = SplitStage | IncludeStage;

export type t = {
  stages: Stage[]
}

const buildStage = (account: Account.Internal.Rich): Stage => {
  const rules = A.map((rule: Rule.Internal.t) => rule.rule)(account.rules);

  const attach = pipe(rules, A.map(Rule.Internal.collectAttach), Pipe.flattenOption);
  const split = pipe(rules, A.map(Rule.Internal.collectSplit), Pipe.flattenOption);
  const include = pipe(rules, A.map(Rule.Internal.collectInclude), Pipe.flattenOption);

  if (include.length > 0) { // INVARIANT: rule validation prevents intermixing split + include in a single account
    return {
        _type: "IncludeStage"
      , tag: account.id
      , attach: attach
      , include: include
      , children: account.children
    };
  } else {
    return {
        _type: "SplitStage"
      , tag: account.id
      , attach: attach
      , split: split
    };
  }
};

export const build = (accounts: Account.Internal.Rich[]): t => {
  return { stages: A.map(buildStage)(accounts) };
};
