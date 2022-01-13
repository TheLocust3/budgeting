import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System, uuid, RuleBuilder } from './util';

const ruleBody = RuleBuilder.include(RuleBuilder.match("id", "Eq", "nonesense"));

let system: System;
let accountId: string;
beforeAll(async () => {
  system = new System();

  await pipe(
      system.addGroup(`test-${uuid()}`)
    , TE.chain(group => system.addAccount(group.id, `test-${uuid()}`))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account: any) => {
            accountId = account.id
          }
      )
  )();
})

it('can add rule', async () => {
  await pipe(
      system.addRule(accountId, ruleBody)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rule: any) => {
            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, rule: ruleBody }));
            expect(typeof rule.id).toBe('string');
          }
      )
  )();
});

it('can\'t add rule with invalid accountId', async () => {
  await pipe(
      system.addRule("test", ruleBody)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (res) => { expect(res.message).toBe('failed') }
      )
  )();
});

it('can\'t add rule with made up field', async () => {
  await pipe(
      system.addRule("test", RuleBuilder.include(RuleBuilder.match("test", "Eq", "nonesense")))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (res) => { expect(res.message).toBe('failed') }
      )
  )();
});

it('can get rule', async () => {
  await pipe(
      system.addRule(accountId, ruleBody)
    , TE.chain((rule) => system.getRule(rule.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (_rule) => {
            const rule = _rule.rule
            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, rule: ruleBody }));
            expect(typeof rule.id).toBe('string');
          }
      )
  )();
});

it('can list rules', async () => {
  await pipe(
      system.addRule(accountId, ruleBody)
    , TE.chain((rule) => TE.map(rules => [rules, rule.id])(system.listRules(accountId)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ([rules, ruleId]) => {
            const rule = rules.rules.filter((rule: any) => rule.id === ruleId)[0]

            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, rule: ruleBody }));
            expect(typeof rule.id).toBe('string');
          }
      )
  )();
});

it('can delete rule', async () => {
  await pipe(
      system.addRule(accountId, ruleBody)
    , TE.chain((rule) => TE.map(_ => rule.id)(system.deleteRule(rule.id)))
    , TE.chain((ruleId) => TE.map(rules => [rules, ruleId])(system.listRules(accountId)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ([rules, ruleId]) => {
            const rule = rules.rules.filter((rule: any) => rule.id === ruleId)

            expect(rule.length).toEqual(0);
          }
      )
  )();
});
