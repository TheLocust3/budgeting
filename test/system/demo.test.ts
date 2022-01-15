import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System, uuid, RuleBuilder, MetadataBuilder, JsonTransaction, defaultTransaction, addTransaction as addTransaction2 } from './util';

const addTransaction = (transaction: JsonTransaction = defaultTransaction): TE.TaskEither<Error, any> => {
  return addTransaction2(system)(transaction);
}

let system: System;
let groupId: string;
beforeAll(async () => {
  system = new System();

  await pipe(
      system.addGroup(`test-${uuid()}`)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (group: any) => {
            groupId = group.id
          }
      )
  )();
})

it('can demo', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
      // setup global transaction environment
    , TE.bind('globalAccount', () => system.addAccount(groupId, name))
      // include all transactions _for this test_ in the global environment
    , TE.bind('globalRule', ({ globalAccount }) => {
        return system.addRule(globalAccount.id, RuleBuilder.include(RuleBuilder.stringMatch("merchantName", "Eq", merchantName)));
      })
      // add a couple transactions (tack on merchantName so we only get back transactions from this test)
    , TE.bind('transaction1', () => addTransaction({ ...defaultTransaction, merchantName: merchantName, sourceId: "Ally Bank", amount: -20 }))
    , TE.bind('transaction2', () => addTransaction({ ...defaultTransaction, merchantName: merchantName, sourceId: "Ally Bank", amount: +100 }))
      // add a comment to transaction1
    , TE.bind('comment1', ({ globalAccount, transaction1 }) => {
        return system.addRule(globalAccount.id, RuleBuilder.updateString(
            RuleBuilder.stringMatch("id", "Eq", transaction1.id)
          , RuleBuilder.customStringField("comment")
          , RuleBuilder.stringLit("Laundry")
        ));
      })
      // setup my bank account
    , TE.bind('account', ({ globalAccount }) => system.addAccount(groupId, name, O.some(globalAccount.id)))
      // add "Ally Bank" transactions into my bank account
    , TE.bind('rule1', ({ account, transaction1 }) => {
        return system.addRule(account.id, RuleBuilder.include(RuleBuilder.stringMatch("sourceId", "Eq", "Ally Bank")));
      })
      // materialize my Ally Bank account
    , TE.bind('rows', ({ account }) => system.materializeFull(account.id))
      // we get back transaction1 with my comment + transaction2 and no conflicts are reported
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rows }) => {
            expect(rows).toEqual({
                transactions: [{ ...transaction1, custom: { comment: "Laundry" } }, transaction2]
              , conflicts: []
            });
          }
      )
  )();
});