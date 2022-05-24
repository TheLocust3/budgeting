import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid, RuleBuilder } from "./util";

const ruleBody = RuleBuilder.attach(RuleBuilder.stringMatch("id", "Eq", "nonesense"), "test", "hello");

let system: System;
let accountId: string;
let userId: string;
beforeAll(async () => {
  system = new System();
  userId = await system.createTestUser();

  await pipe(
      system.addAccount(`test-${uuid()}`, O.none, userId)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account: any) => {
            accountId = account.id;
          }
      )
  )();
});

it("can add rule 1", async () => {
  await pipe(
      system.addRule(accountId, ruleBody, userId)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rule: any) => {
            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, rule: ruleBody }));
            expect(typeof rule.id).toBe("string");
          }
      )
  )();
});

it("can add rule 2", async () => {
  await pipe(
      system.addRule(accountId, RuleBuilder.attach(
          RuleBuilder.stringMatch("id", "Neq", "")
        , "test"
        , "hello"
      ), userId)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rule: any) => {
            expect(rule).toEqual(expect.objectContaining({
                accountId: accountId
              , rule: RuleBuilder.attach(
                    RuleBuilder.stringMatch("id", "Neq", "")
                  , "test"
                  , "hello"
                )
            }));
            expect(typeof rule.id).toBe("string");
          }
      )
  )();
});

it("can't add rule with invalid accountId", async () => {
  await pipe(
      system.addRule("test", ruleBody, userId)
    , TE.match(
          (error) => { expect(true);; }
        , (res) => { expect(false); }
      )
  )();
});

it("can't add rule with made up field", async () => {
  await pipe(
      system.addRule(accountId, RuleBuilder.attach(RuleBuilder.stringMatch("test", "Eq", "nonesense"), "test", "hello"), userId)
    , TE.match(
          (error) => { expect(true);; }
        , (res) => { expect(false); }
      )
  )();
});

it("can get rule", async () => {
  await pipe(
      system.addRule(accountId, ruleBody, userId)
    , TE.chain((rule) => system.getRule(rule.id, accountId, userId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rule) => {
            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, rule: ruleBody }));
            expect(typeof rule.id).toBe("string");
          }
      )
  )();
});

it("can list rules", async () => {
  await pipe(
      system.addRule(accountId, ruleBody, userId)
    , TE.chain((rule) => TE.map(rules => [rules, rule.id])(system.listRules(accountId, userId)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ([rules, ruleId]) => {
            const rule = rules.filter((rule: any) => rule.id === ruleId)[0];

            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, rule: ruleBody }));
            expect(typeof rule.id).toBe("string");
          }
      )
  )();
});

it("can delete rule", async () => {
  await pipe(
      system.addRule(accountId, ruleBody, userId)
    , TE.chain((rule) => TE.map(_ => rule.id)(system.deleteRule(rule.id, accountId, userId)))
    , TE.chain((ruleId) => TE.map(rules => [rules, ruleId])(system.listRules(accountId, userId)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ([rules, ruleId]) => {
            const rule = rules.filter((rule: any) => rule.id === ruleId);

            expect(rule.length).toEqual(0);
          }
      )
  )();
});
