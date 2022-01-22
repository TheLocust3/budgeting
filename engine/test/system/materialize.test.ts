import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid, RuleBuilder, MetadataBuilder, JsonTransaction, defaultTransaction, addTransaction as addTransaction2 } from "./util";

const addTransaction = (transaction: JsonTransaction = defaultTransaction): TE.TaskEither<Error, any> => {
  return addTransaction2(system)(transaction);
};

let system: System;
beforeAll(async () => {
  system = new System();
});

it("can materialize empty", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(name)
    , TE.chain((account) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rows: any) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {}
            }));
            expect(typeof rows.untagged.length).toBe("number"); // make sure untagged exists
          }
      )
  )();
});

it("can materialize split with no matches", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("rule", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", "nonesense")
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.chain(({ account, rule }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rows: any) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {}
            }));
          }
      )
  )();
});

it("can materialize split for specific transaction", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule", ({ account, child1, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: { [child1.id]: [transaction] }
            }));
          }
      )
  )();
});

it("can split transaction in two", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule", ({ account, child1, child2, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.percent(child1.id, 0.3), RuleBuilder.percent(child2.id, 0.7)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction, amount: transaction.amount * 0.3 }]
                  , [child2.id]: [{ ...transaction, amount: transaction.amount * 0.7 }]
                }
            }));
          }
      )
  )();
});

it("can split two transactions via two rules", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction())
    , TE.bind("transaction2", () => addTransaction())
    , TE.bind("rule1", ({ account, child1, child2, transaction1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction1.id)
          , [RuleBuilder.percent(child1.id, 0.3), RuleBuilder.percent(child2.id, 0.7)]
        ));
      })
    , TE.bind("rule2", ({ account, child1, child2, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction2.id)
          , [RuleBuilder.percent(child1.id, 0.5), RuleBuilder.percent(child2.id, 0.5)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction1, amount: transaction1.amount * 0.3 }, { ...transaction2, amount: transaction2.amount * 0.5 }]
                  , [child2.id]: [{ ...transaction1, amount: transaction1.amount * 0.7 }, { ...transaction2, amount: transaction2.amount * 0.5 }]
                }
            }));
          }
      )
  )();
});

it("can split one transactions via one rule against two transactions", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction())
    , TE.bind("transaction2", () => addTransaction())
    , TE.bind("rule1", ({ account, child1, child2, transaction1, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("id", "Neq", transaction1.id)
              , RuleBuilder.stringMatch("id", "Eq", transaction2.id)
            )
          , [RuleBuilder.percent(child1.id, 0.5), RuleBuilder.percent(child2.id, 0.5)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction2, amount: transaction2.amount * 0.5 }]
                  , [child2.id]: [{ ...transaction2, amount: transaction2.amount * 0.5 }]
                }
            }));
          }
      )
  )();
});

it("can split one transactions via one rule against two transactions (not)", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction())
    , TE.bind("transaction2", () => addTransaction())
    , TE.bind("rule1", ({ account, child1, child2, transaction1, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.not(RuleBuilder.stringMatch("id", "Eq", transaction1.id))
              , RuleBuilder.stringMatch("id", "Eq", transaction2.id)
            )
          , [RuleBuilder.percent(child1.id, 0.5), RuleBuilder.percent(child2.id, 0.5)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction2, amount: transaction2.amount * 0.5 }]
                  , [child2.id]: [{ ...transaction2, amount: transaction2.amount * 0.5 }]
                }
            }));
          }
      )
  )();
});

it("can split two transactions via one rule", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account, child1, child2 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
          , [RuleBuilder.percent(child1.id, 0.5), RuleBuilder.percent(child2.id, 0.5)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction1, amount: transaction1.amount * 0.5 }, { ...transaction2, amount: transaction2.amount * 0.5 }]
                  , [child2.id]: [{ ...transaction1, amount: transaction1.amount * 0.5 }, { ...transaction2, amount: transaction2.amount * 0.5 }]
                }
            }));
          }
      )
  )();
});

it("can attach metadata to a transaction", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule1", ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.attach(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , "comment"
          , "test"
        ));
      })
    , TE.bind("rule2", ({ account, child1, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [{ ...transaction, custom: { "comment": ["test"] }}]
                }
            }));
          }
      )
  )();
});

it("can attach metadata to a transaction on the same field", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule1", ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.attach(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , "comment"
          , "test"
        ));
      })
    , TE.bind("rule2", ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.attach(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , "comment"
          , "test2"
        ));
      })
    , TE.bind("rule3", ({ account, child1, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [{ ...transaction, custom: { "comment": ["test", "test2"] }}]
                }
            }));
          }
      )
  )();
});

it("can attach two pieces of metadata to a transaction", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule1", ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.attach(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , "comment"
          , "test"
        ));
      })
    , TE.bind("rule2", ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.attach(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , "comment2"
          , "test2"
        ));
      })
    , TE.bind("rule3", ({ account, child1, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [{ ...transaction, custom: { "comment": ["test"], "comment2": ["test2"] }}]
                }
            }));
          }
      )
  )();
});

it("can split a transaction operating on amount (eq)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.numberMatch("amount", "Eq", 10)
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1]
                }
            }));
          }
      )
  )();
});

it("can split a transaction operating on amount (neq)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.numberMatch("amount", "Neq", 10)
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction2]
                }
            }));
          }
      )
  )();
});

it("can split a transaction operating on amount (lt)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.numberMatch("amount", "Lt", 10)
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction2]
                }
            }));
          }
      )
  )();
});

it("can split a transaction operating on amount (lte)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.numberMatch("amount", "Lte", 10)
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1, transaction2]
                }
            }));
          }
      )
  )();
});

it("can split a transaction operating on amount (gt)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.numberMatch("amount", "Gt", 5)
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1]
                }
            }));
          }
      )
  )();
});

it("can split a transaction operating on amount (gte)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.numberMatch("amount", "Gte", 5)
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1, transaction2]
                }
            }));
          }
      )
  )();
});

it("can split a transaction (glob) 1", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, description: "hello world" }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, description: "jake kinsella" }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.stringGlob("description", "hello world")
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1]
                }
            }));
          }
      )
  )();
});

it("can split a transaction (glob) 2", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, description: "hello world" }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, description: "jake kinsella" }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.stringGlob("description", "*world")
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1]
                }
            }));
          }
      )
  )();
});

it("can split a transaction (glob) 3", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, description: "hello world" }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, description: "jake kinsella" }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.stringGlob("description", "*e*")
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1, transaction2]
                }
            }));
          }
      )
  )();
});

it("can split a transaction with exists", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  const capturedAt = new Date();

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, capturedAt: O.some(capturedAt) }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, capturedAt: O.none }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.exists("capturedAt")
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1]
                }
            }));
          }
      )
  )();
});

it("can split a transaction with exists (not)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  const capturedAt = new Date();

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, capturedAt: O.some(capturedAt) }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, capturedAt: O.none }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.not(RuleBuilder.exists("capturedAt"))
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction2]
                }
            }));
          }
      )
  )();
});

it("can split a transaction on capturedAt 1", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  const now = new Date().getTime();

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, capturedAt: O.some(new Date(now)) }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, capturedAt: O.none }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.numberMatch("capturedAt", "Eq", now)
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1]
                }
            }));
          }
      )
  )();
});

it("can split a transaction on capturedAt 2", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  const now = new Date().getTime();

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, capturedAt: O.some(new Date(now)) }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, capturedAt: O.none }))
    , TE.bind("rule1", ({ account, child1 }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.and(
                RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
              , RuleBuilder.numberMatch("capturedAt", "Lt", now + 60000)
            )
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                  [child1.id]: [transaction1]
                }
            }));
          }
      )
  )();
});

it("can split transaction in two by value", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule", ({ account, child1, child2, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByValue(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.value(child1.id, 7)]
          , child2.id
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction, amount: 7 }]
                  , [child2.id]: [{ ...transaction, amount: 3 }]
                }
            }));
          }
      )
  )();
});

it("can split transaction in three by value", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child3", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule", ({ account, child1, child2, child3, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByValue(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.value(child1.id, 3), RuleBuilder.value(child2.id, 5)]
          , child3.id
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, child3, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction, amount: 3 }]
                  , [child2.id]: [{ ...transaction, amount: 5 }]
                  , [child3.id]: [{ ...transaction, amount: 2 }]
                }
            }));
          }
      )
  )();
});

it("can split transaction in three by value without remainder", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child3", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule", ({ account, child1, child2, child3, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByValue(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.value(child1.id, 6), RuleBuilder.value(child2.id, 4)]
          , child3.id
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, child3, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction, amount: 6 }]
                  , [child2.id]: [{ ...transaction, amount: 4 }]
                }
            }));
          }
      )
  )();
});

it("can materialize child with parent splitting for a specific transaction", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule", ({ account, child1, transaction }) => {
        return system.addRule(account.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , [RuleBuilder.percent(child1.id, 1)]
        ));
      })
    , TE.bind("rows", ({ child1 }) => system.materialize(child1.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {}
              , untagged: [transaction]
            }));
          }
      )
  )();
});

it("can materialize include for specific transaction", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule", ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.stringMatch("id", "Eq", transaction.id)
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: { [child1.id]: [transaction] }
              , untagged: []
            }));
          }
      )
  )();
});

it("can materialize include for specific transaction across multiple children", async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => system.addAccount(name))
    , TE.bind("child1", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("child2", ({ account }) => system.addAccount(name, O.some(account.id)))
    , TE.bind("transaction", () => addTransaction())
    , TE.bind("rule", ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.stringMatch("id", "Eq", transaction.id)
        ));
      })
    , TE.bind("rows", ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, transaction, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: { [child1.id]: [transaction], [child2.id]: [transaction] }
              , untagged: []
            }));
          }
      )
  )();
});

it("can materialize two transactions via include => split (1)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("globalAccount", () => system.addAccount(name))
    , TE.bind("globalRule", ({ globalAccount }) => {
        return system.addRule(globalAccount.id, RuleBuilder.include(
          RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
        ));
      })
    , TE.bind("account1", ({ globalAccount }) => system.addAccount(name, O.some(globalAccount.id)))
    , TE.bind("account2", ({ globalAccount }) => system.addAccount(name, O.some(globalAccount.id)))
    , TE.bind("child1", ({ account1 }) => system.addAccount(name, O.some(account1.id)))
    , TE.bind("child2", ({ account1 }) => system.addAccount(name, O.some(account1.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account1, child1, child2 }) => {
        return system.addRule(account1.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Neq", "")
          , [RuleBuilder.percent(child1.id, 0.5), RuleBuilder.percent(child2.id, 0.5)]
        ));
      })
    , TE.bind("rows", ({ account1 }) => system.materialize(account1.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ child1, child2, transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {
                    [child1.id]: [{ ...transaction1, amount: transaction1.amount * 0.5 }, { ...transaction2, amount: transaction2.amount * 0.5 }]
                  , [child2.id]: [{ ...transaction1, amount: transaction1.amount * 0.5 }, { ...transaction2, amount: transaction2.amount * 0.5 }]
                }
              , untagged: []
            }));
          }
      )
  )();
});

it("can materialize two transactions via include => split (2)", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind("globalAccount", () => system.addAccount(name))
    , TE.bind("globalRule", ({ globalAccount }) => {
        return system.addRule(globalAccount.id, RuleBuilder.include(
          RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
        ));
      })
    , TE.bind("account1", ({ globalAccount }) => system.addAccount(name, O.some(globalAccount.id)))
    , TE.bind("account2", ({ globalAccount }) => system.addAccount(name, O.some(globalAccount.id)))
    , TE.bind("child1", ({ account1 }) => system.addAccount(name, O.some(account1.id)))
    , TE.bind("child2", ({ account1 }) => system.addAccount(name, O.some(account1.id)))
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind("rule1", ({ account1, child1, child2 }) => {
        return system.addRule(account1.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("id", "Neq", "")
          , [RuleBuilder.percent(child1.id, 0.5), RuleBuilder.percent(child2.id, 0.5)]
        ));
      })
    , TE.bind("rows", ({ account2 }) => system.materialize(account2.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rows }) => {
            expect(rows).toEqual(expect.objectContaining({
                conflicts: []
              , tagged: {}
              , untagged: [transaction1, transaction2]
            }));
          }
      )
  )();
});
