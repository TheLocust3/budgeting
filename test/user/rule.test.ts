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

import { pool, log, plaidClient, wrapperBuilder, Wrapper } from './util';

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

it("can create a split rule", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(bucketName)))
    , TE.bind("rule", ({ transaction, bucket }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(log)(arena)(transaction.id, [], bucket.id)))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializeVirtual(pool)(log)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ bucket, materialized }) => {
            expect(materialized.tagged[bucket.id]).toEqual(expect.objectContaining({
              transactions: expect.arrayContaining([expect.objectContaining({ amount: 100, merchantName: "Test Merchant", description: "A purchase" })])
            }));
            expect(materialized.conflicts).toEqual([]);
            expect(materialized.untagged).toEqual([]);
          }
      )
  )();
});

it("can create a split rule 2", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(bucketName)))
    , TE.bind("rule", ({ transaction, bucket }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(log)(arena)(transaction.id, [{ bucket: bucket.id, value: 1 }], bucket.id)))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializeVirtual(pool)(log)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ bucket, materialized }) => {
            expect(materialized.tagged[bucket.id]).toEqual(expect.objectContaining({
              transactions: expect.arrayContaining([
                expect.objectContaining({ amount: 1, merchantName: "Test Merchant", description: "A purchase" }),
                expect.objectContaining({ amount: 99, merchantName: "Test Merchant", description: "A purchase" })
              ])
            }));
            expect(materialized.conflicts).toEqual([]);
            expect(materialized.untagged).toEqual([]);
          }
      )
  )();
});

it("can delete rule", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(bucketName)))
    , TE.bind("rule", ({ transaction, bucket }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(log)(arena)(transaction.id, [], bucket.id)))
    , TE.bind("deleted", ({ rule }) => wrap((arena) => UserResource.Rule.remove(pool)(log)(arena)(rule.id)))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializeVirtual(pool)(log)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ bucket, materialized }) => {
            expect(materialized.tagged[bucket.id]).toEqual(expect.objectContaining({
              transactions: []
            }));
            expect(materialized.conflicts).toEqual([]);
            expect(materialized.untagged).toEqual(
              expect.arrayContaining([expect.objectContaining({ amount: 100, merchantName: "Test Merchant", description: "A purchase" })])
            );
          }
      )
  )();
});

it("can't delete unknown rule", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(bucketName)))
    , TE.bind("rule", ({ transaction, bucket }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(log)(arena)(transaction.id, [], bucket.id)))
    , TE.bind("deleted", ({ rule }) => wrap((arena) => UserResource.Rule.remove(pool)(log)(arena)("nonsense")))
    , TE.match(
          (error: Exception.t) => { expect(error).toEqual(Exception.throwNotFound) }
        , () => { throw new Error(`Should not have been able to delete rule`); }
      )
  )();
});

it("can't create a split rule against unknown transaction", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(bucketName)))
    , TE.bind("rule", ({ transaction, bucket }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(log)(arena)("nonsense", [], bucket.id)))
    , TE.match(
          (error: Exception.t) => { expect(error).toEqual(Exception.throwNotFound) }
        , () => { throw new Error(`Should not have been able to create rule`); }
      )
  )();
});

it("can't create a split rule against unknown bucket", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(log)(arena)(bucketName)))
    , TE.bind("rule", ({ transaction, bucket }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(log)(arena)(transaction.id, [], "nonsense")))
    , TE.match(
          (error: Exception.t) => { expect(error).toEqual(Exception.throwInvalidRule) }
        , () => { throw new Error(`Should not have been able to create rule`); }
      )
  )();
});
