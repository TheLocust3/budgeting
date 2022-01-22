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

it("can demo", async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
      // setup global transaction environment
    , TE.bind("globalAccount", () => system.addAccount(name))
      // include all transactions _for this test_ in the global environment
    , TE.bind("globalRule", ({ globalAccount }) => {
        return system.addRule(globalAccount.id, RuleBuilder.include(RuleBuilder.stringMatch("merchantName", "Eq", merchantName)));
      })
      // setup account for physical accounts
    , TE.bind("physicalAccount", ({ globalAccount }) => system.addAccount(name, O.some(globalAccount.id)))
      // setup account for virtual accounts
    , TE.bind("virtualAccount", ({ globalAccount }) => system.addAccount(name, O.some(globalAccount.id)))
      // add a couple transactions (tack on merchantName so we only get back transactions from this test)
    , TE.bind("transaction1", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, sourceId: "Ally Bank", amount: -20 }))
    , TE.bind("transaction2", () => addTransaction({ ...defaultTransaction, merchantName: merchantName, sourceId: "Ally Bank", amount: +100 }))
      // add a comment to transaction1
    , TE.bind("comment1", ({ globalAccount, transaction1 }) => {
        return system.addRule(globalAccount.id, RuleBuilder.attach(
            RuleBuilder.stringMatch("id", "Eq", transaction1.id)
          , "comment"
          , "Laundry"
        ));
      })
      // setup my Ally Bank account
    , TE.bind("allyBank", ({ physicalAccount }) => system.addAccount(name, O.some(physicalAccount.id)))
      // create a physical bank account rule to move "Ally Bank" transactions into my bank account
    , TE.bind("allyBankRule", ({ physicalAccount, allyBank }) => {
        return system.addRule(physicalAccount.id, RuleBuilder.splitByPercent(
            RuleBuilder.stringMatch("sourceId", "Eq", "Ally Bank")
          , [RuleBuilder.percent(allyBank.id, 1)]
        ));
      })
      // setup my Vacation account
    , TE.bind("vacationAccount", ({ virtualAccount }) => system.addAccount(name, O.some(virtualAccount.id)))
      // create a physical bank account rule to move "Ally Bank" transactions into my bank account
    , TE.bind("vacationRule", ({ virtualAccount, vacationAccount }) => {
        return system.addRule(virtualAccount.id, RuleBuilder.splitByPercent(
            RuleBuilder.numberMatch("amount", "Gte", 100)
          , [RuleBuilder.percent(vacationAccount.id, 1)]
        ));
      })
      // materialize my physical bank accounts
    , TE.bind("physicalRows", ({ physicalAccount }) => system.materialize(physicalAccount.id))
      // materialize my virtual bank accounts
    , TE.bind("virtualRows", ({ virtualAccount }) => system.materialize(virtualAccount.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ allyBank, vacationAccount, transaction1, transaction2, physicalRows, virtualRows }) => {
            // all transactions come back and are placed in the Ally Bank account
            expect(physicalRows).toEqual({
                conflicts: []
              , tagged: {
                    [allyBank.id]: [{ ...transaction1, custom: { comment: ["Laundry"] } }, transaction2]
                }
              , untagged: []
            });

            // the +100 transaction goes into the vacation account while the -20 expense is untagged
            expect(virtualRows).toEqual({
                conflicts: []
              , tagged: {
                    [vacationAccount.id]: [transaction2]
                }
              , untagged: [{ ...transaction1, custom: { comment: ["Laundry"] } }]
            });
          }
      )
  )();
});
