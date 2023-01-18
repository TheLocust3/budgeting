import crypto from "crypto";
import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { UserArena, UserResource } from "../../src/user";
import { PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "../../src/user/util";
import { UserFrontend } from "../../src/storage";
import { User, Transaction } from "../../src/model";
import { Exception } from "../../src/magic";

import { pool, log, wrapperBuilder, Wrapper } from './util';

let user: User.Internal.t;
let wrap: Wrapper;
beforeEach(async () => {
  const id = crypto.randomUUID();
  const email = `test-${crypto.randomUUID()}`;

  await TE.match(
      (error: Exception.t) => { throw new Error(`Failed with ${error}`); }
    , (newUser: User.Internal.t) => user = newUser
  )(UserResource.create(pool)(log)({ id: id, email: email, role: User.DEFAULT_ROLE }))();

  wrap = wrapperBuilder(user);
});

const sampleTransaction = (sourceId: string): Transaction.Arena.Create.t => {
  return {
      sourceId: sourceId
    , amount: 100
    , merchantName: "Test Merchant"
    , description: "A purchase"
    , authorizedAt: new Date()
    , capturedAt: O.none
    , metadata: {}
  };
}

it("can resolve physical accounts", async () => {
  await pipe(
      wrap((arena) => UserArena.physical(pool)(log)(arena))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accountArena: UserArena.Account.t) => {
            expect(accountArena).toEqual(expect.objectContaining({ children: [] }));
            expect(accountArena.account).toEqual(expect.objectContaining({ name: PHYSICAL_ACCOUNT }));
          }
      )
  )();
});

it("can resolve virtual accounts", async () => {
  await pipe(
      wrap((arena) => UserArena.virtual(pool)(log)(arena))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accountArena: UserArena.Account.t) => {
            expect(accountArena).toEqual(expect.objectContaining({ children: [] }));
            expect(accountArena.account).toEqual(expect.objectContaining({ name: VIRTUAL_ACCOUNT }));
          }
      )
  )();
});

it("can add physical account", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.physical(pool)(log)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accountArena: UserArena.Account.t) => {
            expect(accountArena.account).toEqual(expect.objectContaining({ name: PHYSICAL_ACCOUNT }));

            expect(accountArena.children.length).toEqual(1);
            expect(accountArena.children).toEqual(expect.arrayContaining([
              expect.objectContaining({ account: expect.objectContaining({ name: name }) })
            ]));
          }
      )
  )();
});

it("can delete physical account", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name))
    , TE.chain(({ account }) => wrap((arena) => UserResource.Account.remove(pool)(log)(arena)(account.id)))
    , TE.chain(() => wrap((arena) => UserArena.physical(pool)(log)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${JSON.stringify(error)}`); }
        , (accountArena: UserArena.Account.t) => {
            expect(accountArena.account).toEqual(expect.objectContaining({ name: PHYSICAL_ACCOUNT }));
            expect(accountArena.children.length).toEqual(0);
          }
      )
  )();
});

it("can't delete unknown physical account", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name))
    , TE.chain(({ account }) => wrap((arena) => UserResource.Account.remove(pool)(log)(arena)("nonsense")))
    , TE.match(
          (error: Exception.t) => { expect(error).toEqual(Exception.throwNotFound) }
        , () => {
            throw new Error(`Should not have been able to delete account`);
          }
      )
  )();
});

it("can add virtual bucket", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.virtual(pool)(log)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accountArena: UserArena.Account.t) => {
            expect(accountArena.account).toEqual(expect.objectContaining({ name: VIRTUAL_ACCOUNT }));

            expect(accountArena.children.length).toEqual(1);
            expect(accountArena.children).toEqual(expect.arrayContaining([
              expect.objectContaining({ account: expect.objectContaining({ name: name }) })
            ]));
          }
      )
  )();
});

it("can't delete virtual account", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(name))
    , TE.chain((account) => wrap((arena) => UserResource.Account.remove(pool)(log)(arena)(account.id)))
    , TE.match(
          (error: Exception.t) => { expect(error.name).toEqual("ValidationError") }
        , () => { throw new Error(`Should not have been able to delete bucket`); }
      )
  )();
});

it("can't delete unknown virtual account", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(name))
    , TE.chain((account) => wrap((arena) => UserResource.Bucket.remove(pool)(log)(arena)("nonsense")))
    , TE.match(
          (error: Exception.t) => { expect(error.name).toEqual("NotFound") }
        , () => { throw new Error(`Should not have been able to delete bucket`); }
      )
  )();
});

it("can't delete virtual account with transactions", async () => {
  const accountName = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(accountName)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(bucketName)))
    , TE.bind("rule", ({ transaction, bucket }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(log)(arena)(transaction.id, [], bucket.id)))
    , TE.bind("removed", ({ bucket }) => wrap((arena) => UserResource.Bucket.remove(pool)(log)(arena)(bucket.id)))
    , TE.match(
          (error: Exception.t) => { expect(error.name).toEqual("BadRequest") }
        , () => { throw new Error(`Should not have been able to delete bucket`); }
      )
  )();
});

it("can't delete virtual account with rules but not transactions", async () => {
  const accountName = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(accountName)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(bucketName)))
    , TE.bind("rule", ({ transaction, bucket }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(log)(arena)(transaction.id, [], bucket.id)))
    , TE.bind("removedTransaction", ({ transaction }) => wrap((arena) => UserResource.Transaction.remove(pool)(log)(arena)(transaction.id)))
    , TE.bind("removed", ({ bucket }) => wrap((arena) => UserResource.Bucket.remove(pool)(log)(arena)(bucket.id)))
    , TE.match(
          (error: Exception.t) => { expect(error.name).toEqual("BadRequest") }
        , () => { throw new Error(`Should not have been able to delete bucket`); }
      )
  )();
});
