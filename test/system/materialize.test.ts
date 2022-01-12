import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System, uuid, RuleBuilder, MetadataBuilder } from './util';

const addTransaction = (
      sourceId: string = "sourceId"
    , amount: number = 10
    , merchantName: string = "merchant name"
    , description: string = "description"
    , authorizedAt: Date = new Date()
    , capturedAt: O.Option<Date> = O.none
    , metadata: any = MetadataBuilder.plaid
  ): TE.TaskEither<Error, any> => {
  return system.addTransaction(
      sourceId
    , 10
    , merchantName
    , "test description"
    , authorizedAt
    , O.none
    , MetadataBuilder.plaid
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

/*it('can materialize for specific transaction', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(groupId, name)
    , TE.chain((account) => {
        return TE.map(transaction => [transaction, account.id])(addTransaction());
      })
    , TE.chain(([transaction, accountId]) => {
        const ruleFor = RuleBuilder.include(RuleBuilder.match("id", "Eq", transaction.id))
        return TE.map(_ => [transaction, accountId])(system.addRule(accountId, ruleFor));
      })
    , TE.chain(([transaction, accountId]) => {
        return TE.map(rows => [transaction, rows])(system.materialize(accountId));
      })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ([transaction, rows]) => {
            expect(rows).toEqual({ transactions: [transaction] });
          }
      )
  )();
});*/
