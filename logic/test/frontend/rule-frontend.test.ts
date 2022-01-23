import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import RuleFrontend from "../../src/frontend/rule-frontend";
import AccountFrontend from "../../src/frontend/account-frontend";
import { uuid } from "../system/util";

import { Rule } from "model";

const ruleBody: Rule.Internal.Rule = { _type: "Attach", where: { _type: "StringMatch", field: "id", operator: "Eq", value: "nonesense" }, field: "test", value: "hello" };

let accountId: string;
let accountId2: string;
beforeAll(async () => {
  await pipe(
      AccountFrontend.create({ id: O.none, parentId: O.none, userId: "test", name: "test", rules: [], children: [] })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account) => {
            accountId = O.match(() => "", (account: string) => account)(account.id);
          }
      )
  )();

  await pipe(
      AccountFrontend.create({ id: O.none, parentId: O.none, userId: "test", name: "test", rules: [], children: [] })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account) => {
            accountId2 = O.match(() => "", (account: string) => account)(account.id);
          }
      )
  )();
});

it("can add rule", async () => {
  await pipe(
      RuleFrontend.create({ id: O.none, accountId: accountId, rule: ruleBody })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rule) => {
            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, rule: ruleBody }));
            expect(O.isSome(rule.id)).toBe(true);
          }
      )
  )();
});

it("can get rule", async () => {
  await pipe(
      RuleFrontend.create({ id: O.none, accountId: accountId, rule: ruleBody })
    , TE.chain((rule) => RuleFrontend.getById(rule.accountId)(O.match(() => "", (rule: string) => rule)(rule.id)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rule) => {
            expect(rule).toEqual(expect.objectContaining({ accountId: accountId, rule: ruleBody }));
            expect(O.isSome(rule.id)).toBe(true);
          }
      )
  )();
});

it("can't get other account's rule", async () => {
  await pipe(
      RuleFrontend.create({ id: O.none, accountId: accountId2, rule: ruleBody })
    , TE.chain((rule) => RuleFrontend.getById(accountId)(O.match(() => "", (rule: string) => rule)(rule.id)))
    , TE.match(
          (res) => { expect(res._type).toBe("NotFound"); }
        , (_) => { throw new Error("Got unexpected successful response"); }
      )
  )();
});

it("can list rules", async () => {
  await pipe(
      TE.Do
    , TE.bind('createdRule', () => RuleFrontend.create({ id: O.none, accountId: accountId, rule: ruleBody }))
    , TE.bind('rules', () => RuleFrontend.all(accountId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ createdRule, rules }) => {
            const id = O.match(() => "", (id) => id)(createdRule.id)
            const rule = rules.filter((rule) => O.match(() => "", (id) => id)(rule.id) == id)[0];

            expect(rule).toEqual(expect.objectContaining({ id: createdRule.id, accountId: accountId, rule: ruleBody }));
            expect(O.isSome(rule.id)).toBe(true);

            rules.map((rule) => expect(rule.accountId).toBe(accountId));
          }
      )
  )();
});

it("can delete rule", async () => {
  await pipe(
      TE.Do
    , TE.bind('createdRule', () => RuleFrontend.create({ id: O.none, accountId: accountId, rule: ruleBody }))
    , TE.bind('deleted', ({ createdRule }) => RuleFrontend.deleteById(accountId)(O.match(() => "", (id: string) => id)(createdRule.id)))
    , TE.bind('rules', () => RuleFrontend.all(accountId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ createdRule, rules }) => {
            const id = O.match(() => "", (id) => id)(createdRule.id)
            const rule = rules.filter((rule) => O.match(() => "", (id) => id)(rule.id) == id);

            expect(rule.length).toEqual(0);
          }
      )
  )();
});

it("can't delete other account's rule", async () => {
    await pipe(
      TE.Do
    , TE.bind('createdRule', () => RuleFrontend.create({ id: O.none, accountId: accountId2, rule: ruleBody }))
    , TE.bind('deleted', ({ createdRule }) => RuleFrontend.deleteById(accountId)(O.match(() => "", (id: string) => id)(createdRule.id)))
    , TE.bind('rules', () => RuleFrontend.all(accountId2))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ createdRule, rules }) => {
            const id = O.match(() => "", (id) => id)(createdRule.id)
            const rule = rules.filter((rule) => O.match(() => "", (id) => id)(rule.id) == id)[0];

            expect(rule).toEqual(expect.objectContaining({ rule: ruleBody }));
            expect(O.isSome(rule.id)).toBe(true);
          }
      )
  )();
});
