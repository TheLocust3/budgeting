import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid } from "./util";

let system: System;
let userId: string;
beforeAll(async () => {
  system = new System();
  userId = await system.createTestUser();
});

it("can add account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(name, O.none, userId)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account: any) => {
            expect(account).toEqual(expect.objectContaining({ name: name, userId: userId }));
            expect(typeof account.id).toBe("string");
          }
      )
  )();
});

it("can get account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(name, O.none, userId)
    , TE.chain((account) => system.getAccount(account.id, account.userId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account) => {
            expect(account).toEqual(expect.objectContaining({ name: name, userId: userId }));
            expect(typeof account.id).toBe("string");
          }
      )
  )();
});

it("can list accounts", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(name, O.none, userId)
    , TE.chain((account) => system.listAccounts(account.userId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accounts) => {
            const account = accounts.filter((account: any) => account.name === name)[0];

            expect(account).toEqual(expect.objectContaining({ name: name, userId: userId }));
            expect(typeof account.id).toBe("string");
          }
      )
  )();
});

it("can delete account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      system.addAccount(name, O.none, userId)
    , TE.chain((account) => system.deleteAccount(account.id, userId))
    , TE.chain(() => system.listAccounts(userId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accounts) => {
            const account = accounts.filter((account: any) => account.name === name);

            expect(account.length).toEqual(0);
          }
      )
  )();
});
