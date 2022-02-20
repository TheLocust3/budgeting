import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { AccountChannel, RuleChannel } from "../../src/channel";
import { uuid } from "../system/util";

import { Rule } from "model";

const ruleBody: Rule.Internal.Rule = { _type: "Attach", where: { _type: "StringMatch", field: "id", operator: "Eq", value: "nonesense" }, field: "test", value: "hello" };

let accountId: string;
let accountId2: string;
beforeAll(async () => {
  await pipe(
      AccountChannel.create({ parentId: O.none, userId: "test", name: "test" })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account) => {
            accountId = account.id;
          }
      )
  )();

  await pipe(
      AccountChannel.create({ parentId: O.none, userId: "test", name: "test" })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account) => {
            accountId2 = account.id;
          }
      )
  )();
});

it("can add rule", async () => {
  await pipe(
      RuleChannel.create({ accountId: accountId, userId: "test", rule: ruleBody })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rule) => {
            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, userId: "test", rule: ruleBody }));
            expect(rule.id).not.toBe("");
          }
      )
  )();
});

it("can get rule", async () => {
  await pipe(
      RuleChannel.create({ accountId: accountId, userId: "test", rule: ruleBody })
    , TE.chain((rule) => RuleChannel.getById("test")(rule.accountId)(rule.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rule) => {
            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, userId: "test", rule: ruleBody }));
            expect(rule.id).not.toBe("");
          }
      )
  )();
});

it("can't get other account's rule", async () => {
  await pipe(
      RuleChannel.create({ accountId: accountId2, userId: "test", rule: ruleBody })
    , TE.chain((rule) => RuleChannel.getById("test")(accountId)(rule.id))
    , TE.match(
          (res) => { expect(res._type).toBe("NotFound"); }
        , (_) => { throw new Error("Got unexpected successful response"); }
      )
  )();
});

it("can list rules", async () => {
  await pipe(
      TE.Do
    , TE.bind('createdRule', () => RuleChannel.create({ accountId: accountId, userId: "test", rule: ruleBody }))
    , TE.bind('rules', () => RuleChannel.all("test")(accountId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ createdRule, rules }) => {
            const rule = rules.filter((rule) => rule.id == createdRule.id)[0];

            expect(rule).toEqual(expect.objectContaining({ id: createdRule.id, accountId: accountId, userId: "test", rule: ruleBody }));
            expect(rule.id).not.toBe("");

            rules.map((rule) => expect(rule.accountId).toBe(accountId));
          }
      )
  )();
});

it("can delete rule", async () => {
  await pipe(
      TE.Do
    , TE.bind('createdRule', () => RuleChannel.create({ accountId: accountId, userId: "test", rule: ruleBody }))
    , TE.bind('deleted', ({ createdRule }) => RuleChannel.deleteById("test")(accountId)(createdRule.id))
    , TE.bind('rules', () => RuleChannel.all("test")(accountId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ createdRule, rules }) => {
            const rule = rules.filter((rule) => rule.id == createdRule.id);

            expect(rule.length).toEqual(0);
          }
      )
  )();
});

it("can't delete other account's rule", async () => {
    await pipe(
      TE.Do
    , TE.bind('createdRule', () => RuleChannel.create({ accountId: accountId2, userId: "test", rule: ruleBody }))
    , TE.bind('deleted', ({ createdRule }) => RuleChannel.deleteById("test")(accountId)(createdRule.id))
    , TE.bind('rules', () => RuleChannel.all("test")(accountId2))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ createdRule, rules }) => {
            const rule = rules.filter((rule) => rule.id == createdRule.id)[0];

            expect(rule).toEqual(expect.objectContaining({ rule: ruleBody }));
            expect(rule.id).not.toBe("");
          }
      )
  )();
});
