import { pipe } from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/Array';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

import { System, uuid } from './util';

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

it('can add account', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(groupId, name)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account: any) => {
            expect(account).toEqual(expect.objectContaining({ groupId: groupId, name: name }));
            expect(typeof account.id).toBe('string');
          }
      )
  )();
});

it('can\t add rule with invalid groupId', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount("test", name)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (res) => { expect(res.message).toBe('failed') }
      )
  )();
});

it('can get account', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(groupId, name)
    , TE.chain((account) => system.getAccount(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (_account) => {
            const account = _account.account
            expect(account).toEqual(expect.objectContaining({ groupId: groupId, name: name }));
            expect(typeof account.id).toBe('string');
          }
      )
  )();
});

it('can list accounts', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(groupId, name)
    , TE.chain((_) => system.listAccounts(groupId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accounts) => {
            const account = accounts.accounts.filter((account: any) => account.name === name)[0]

            expect(account).toEqual(expect.objectContaining({ groupId: groupId, name: name }));
            expect(typeof account.id).toBe('string');
          }
      )
  )();
});

it('can delete account', async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(groupId, name)
    , TE.chain((account) => system.deleteAccount(account.id))
    , TE.chain((_) => system.listAccounts(groupId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accounts) => {
            const account = accounts.accounts.filter((account: any) => account.name === name)

            expect(account.length).toEqual(0);
          }
      )
  )();
});
