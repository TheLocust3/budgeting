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

it('can materialize empty without conflicts', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(groupId, name)
    , TE.chain((account) => system.materializeFull(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rows: any) => {
            expect(rows).toEqual({ transactions: [], conflicts: [] });
          }
      )
  )();
});

it('can raise simple conflict', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction', () => addTransaction())
    , TE.bind('rule1', ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.include(RuleBuilder.stringMatch("id", "Eq", transaction.id)));
      })
    , TE.bind('rule2', ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.updateNumber(
            RuleBuilder.stringMatch("id", "Neq", "")
          , "amount"
          , RuleBuilder.numberLit(11)
        ));
      })
    , TE.bind('rule3', ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.updateNumber(
            RuleBuilder.stringMatch("id", "Neq", "")
          , "amount"
          , RuleBuilder.numberLit(12)
        ));
      })
    , TE.bind('rows', ({ account }) => system.materializeFull(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction, rule2, rule3, rows }) => {
            expect(rows).toEqual({
                conflicts: [{ transaction: transaction, rules: [rule2.rule, rule3.rule] }]
              , transactions: []
            });
          }
      )
  )();
});

it('can raise conflict on different fields', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction', () => addTransaction({ ...defaultTransaction, merchantName: merchantName }))
    , TE.bind('rule1', ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.include(RuleBuilder.stringMatch("id", "Eq", transaction.id)));
      })
    , TE.bind('rule2', ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.updateNumber(
            RuleBuilder.stringMatch("id", "Eq", transaction.id)
          , "amount"
          , RuleBuilder.numberLit(11)
        ));
      })
    , TE.bind('rule3', ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.updateNumber(
            RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
          , "amount"
          , RuleBuilder.numberLit(12)
        ));
      })
    , TE.bind('rows', ({ account }) => system.materializeFull(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction, rule2, rule3, rows }) => {
            expect(rows).toEqual({
                conflicts: [{ transaction: transaction, rules: [rule2.rule, rule3.rule] }]
              , transactions: []
            });
          }
      )
  )();
});

it('can raise conflict on different fields on two transactions', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction({ ...defaultTransaction, merchantName: merchantName }))
    , TE.bind('transaction2', () => addTransaction({ ...defaultTransaction, merchantName: merchantName }))
    , TE.bind('rule1', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.include(RuleBuilder.stringMatch("merchantName", "Eq", merchantName)));
      })
    , TE.bind('rule2', ({ account, transaction1 }) => {
        return system.addRule(account.id, RuleBuilder.updateNumber(
            RuleBuilder.stringMatch("id", "Eq", transaction1.id)
          , "amount"
          , RuleBuilder.numberLit(11)
        ));
      })
    , TE.bind('rule3', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.updateNumber(
            RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
          , "amount"
          , RuleBuilder.numberLit(12)
        ));
      })
    , TE.bind('rows', ({ account }) => system.materializeFull(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rule2, rule3, rows }) => {
            expect(rows).toEqual({
                conflicts: [{ transaction: transaction1, rules: [rule2.rule, rule3.rule] }]
              , transactions: [{ ...transaction2, amount: 12 }]
            });
          }
      )
  )();
});
