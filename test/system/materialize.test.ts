import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System, uuid, RuleBuilder, MetadataBuilder } from './util';

type Transaction = {
    sourceId: string
  , amount: number
  , merchantName: string
  , description: string
  , authorizedAt: Date
  , capturedAt: O.Option<Date>
  , metadata: any
}

const defaultTransaction: Transaction = {
  sourceId: "sourceId"
  , amount: 10
  , merchantName: "merchant name"
  , description: "description"
  , authorizedAt: new Date()
  , capturedAt: O.none
  , metadata: MetadataBuilder.plaid
}

const addTransaction = ({
      sourceId
    , amount
    , merchantName
    , description
    , authorizedAt
    , capturedAt
    , metadata
  }: Transaction = defaultTransaction): TE.TaskEither<Error, any> => {
  return system.addTransaction(
      sourceId
    , amount
    , merchantName
    , description
    , authorizedAt
    , capturedAt
    , metadata
  )
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

it('can materialize empty', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(groupId, name)
    , TE.chain((account) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rows: any) => {
            expect(rows).toEqual({ transactions: [] });
          }
      )
  )();
});

it('can materialize bad rule', async () => {
  const name = `test-${uuid()}`;

  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('rule', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.include(RuleBuilder.stringMatch("id", "Eq", "nonesense")))
      })
    , TE.chain(({ account, rule }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (rows: any) => {
            expect(rows).toEqual({ transactions: [] });
          }
      )
  )();
});

it('can materialize for specific transaction', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction', () => addTransaction())
    , TE.bind('rule', ({ account, transaction }) => {
        return system.addRule(account.id, RuleBuilder.include(RuleBuilder.stringMatch("id", "Eq", transaction.id)));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction, rows }) => {
            expect(rows).toEqual({ transactions: [transaction] });
          }
      )
  )();
});

it('can materialize for two transactions via two rules', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction())
    , TE.bind('transaction2', () => addTransaction())
    , TE.bind('rule1', ({ account, transaction1 }) => {
        return system.addRule(account.id, RuleBuilder.include(RuleBuilder.stringMatch("id", "Eq", transaction1.id)));
      })
    , TE.bind('rule2', ({ account, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.include(RuleBuilder.stringMatch("id", "Eq", transaction2.id)));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rows }) => {
            expect(rows).toEqual({ transactions: [transaction1, transaction2] });
          }
      )
  )();
});

it('can materialize over two transactions only one included', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction())
    , TE.bind('transaction2', () => addTransaction())
    , TE.bind('rule1', ({ account, transaction1, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.and(
              RuleBuilder.stringMatch("id", "Neq", transaction1.id)
            , RuleBuilder.stringMatch("id", "Eq", transaction2.id)
          )
        ));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rows }) => {
            expect(rows).toEqual({ transactions: [transaction2] });
          }
      )
  )();
});

it('can materialize over two transactions only one included (not)', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction())
    , TE.bind('transaction2', () => addTransaction())
    , TE.bind('rule1', ({ account, transaction1, transaction2 }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.and(
              RuleBuilder.not(RuleBuilder.stringMatch("id", "Eq", transaction1.id))
            , RuleBuilder.stringMatch("id", "Eq", transaction2.id)
          )
        ));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rows }) => {
            expect(rows).toEqual({ transactions: [transaction2] });
          }
      )
  )();
});

it('can materialize for specific transaction operating on amount (eq)', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind('transaction2', () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind('rule1', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.and(
              RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
            , RuleBuilder.numberMatch("amount", "Eq", 10)
          )
        ));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, rows }) => {
            expect(rows).toEqual({ transactions: [transaction1] });
          }
      )
  )();
});

it('can materialize for specific transaction operating on amount (neq)', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind('transaction2', () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind('rule1', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.and(
              RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
            , RuleBuilder.numberMatch("amount", "Neq", 10)
          )
        ));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction2, rows }) => {
            expect(rows).toEqual({ transactions: [transaction2] });
          }
      )
  )();
});

it('can materialize for specific transaction operating on amount (lt)', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind('transaction2', () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind('rule1', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.and(
              RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
            , RuleBuilder.numberMatch("amount", "Lt", 10)
          )
        ));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction2, rows }) => {
            expect(rows).toEqual({ transactions: [transaction2] });
          }
      )
  )();
});

it('can materialize for specific transaction operating on amount (lte)', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind('transaction2', () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind('rule1', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.and(
              RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
            , RuleBuilder.numberMatch("amount", "Lte", 10)
          )
        ));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rows }) => {
            expect(rows).toEqual({ transactions: [transaction1, transaction2] });
          }
      )
  )();
});

it('can materialize for specific transaction operating on amount (gt)', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind('transaction2', () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind('rule1', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.and(
              RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
            , RuleBuilder.numberMatch("amount", "Gt", 5)
          )
        ));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, rows }) => {
            expect(rows).toEqual({ transactions: [transaction1] });
          }
      )
  )();
});

it('can materialize for specific transaction operating on amount (gte)', async () => {
  const name = `test-${uuid()}`;
  const merchantName = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('account', () => system.addAccount(groupId, name))
    , TE.bind('transaction1', () => addTransaction({ ...defaultTransaction, amount: 10, merchantName: merchantName }))
    , TE.bind('transaction2', () => addTransaction({ ...defaultTransaction, amount: 5, merchantName: merchantName }))
    , TE.bind('rule1', ({ account }) => {
        return system.addRule(account.id, RuleBuilder.include(
          RuleBuilder.and(
              RuleBuilder.stringMatch("merchantName", "Eq", merchantName)
            , RuleBuilder.numberMatch("amount", "Gte", 5)
          )
        ));
      })
    , TE.bind('rows', ({ account }) => system.materialize(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ transaction1, transaction2, rows }) => {
            expect(rows).toEqual({ transactions: [transaction1, transaction2] });
          }
      )
  )();
});
