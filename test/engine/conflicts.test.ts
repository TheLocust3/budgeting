import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid, RuleBuilder, MetadataBuilder, JsonTransaction, defaultTransaction, addTransaction as addTransaction2 } from "./util";

let system: System;
let sourceId: string;
beforeAll(async () => {
  system = await System.build();
  sourceId = await system.buildTestSource();
});

const addTransaction = (transaction: JsonTransaction = defaultTransaction): TE.TaskEither<Error, any> => {
  return addTransaction2(system)({ ...transaction, userId: system.userId, sourceId: sourceId });
};

it("can raise simple conflict", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule1", ({ account, child1, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rule2", ({ account, child2, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.percent(child2.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction, rule1, rule2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: [{ _type: "Conflict", element: transaction, rules: [rule1.rule, rule2.rule] }]
            }));
          }
      )
  )();
});

it("can raise conflict without aborting", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction())
    , TE.bind("transaction2", () => addTransaction())
    , TE.bind("rule1", ({ account, child1, transaction1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction1.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rule2", ({ account, child2, transaction1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction1.id)
          , [RuleBuilder.percent(child2.id, 1)]
        ));
      })
    , TE.bind("rule3", ({ account, child2, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction2.id)
          , [RuleBuilder.percent(child2.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, child2, rule1, rule2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: [{ _type: "Conflict", element: transaction1, rules: [rule1.rule, rule2.rule] }]
              , tagged: expect.objectContaining({ [child2.id]: [transaction2] })
            }));
          }
      )
  )();
});

it("can raise two conflicts", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction())
    , TE.bind("transaction2", () => addTransaction())
    , TE.bind("rule1", ({ account, child1, transaction1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction1.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rule2", ({ account, child2, transaction1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction1.id)
          , [RuleBuilder.percent(child2.id, 1)]
        ));
      })
    , TE.bind("rule3", ({ account, child1, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction2.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rule4", ({ account, child2, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction2.id)
          , [RuleBuilder.percent(child2.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rule1, rule2, rule3, rule4, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: [
                    { _type: "Conflict", element: transaction1, rules: [rule1.rule, rule2.rule] }
                  , { _type: "Conflict", element: transaction2, rules: [rule3.rule, rule4.rule] }
                ]
            }));
          }
      )
  )();
});
