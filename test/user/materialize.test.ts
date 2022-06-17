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

import { pool, plaidClient, wrapperBuilder, Wrapper } from './util';

let user: User.Internal.t;
let wrap: Wrapper;
beforeEach(async () => {
  const id = crypto.randomUUID();
  const email = `test-${crypto.randomUUID()}`;

  await TE.match(
      (error: Exception.t) => { throw new Error(`Failed with ${error}`); }
    , (newUser: User.Internal.t) => user = newUser
  )(UserResource.create(pool)({ id: id, email: email, password: "foobar", role: User.DEFAULT_ROLE }))();

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

it("can materialize physical", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(arena)(name)))
    , TE.bind("transactionArena", () => wrap((arena) => UserArena.materializePhysical(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ account, transactionArena }) => {
            expect(transactionArena.tagged).toEqual({
              [account.account.id]: { transactions: [], total: 0 }
            });
            expect(transactionArena.conflicts).toEqual([]);
            expect(transactionArena.untagged).toEqual([]);
            expect(transactionArena.total).toEqual(0);
          }
      )
  )();
});

it("can materialize empty physical", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserArena.materializePhysical(pool)(arena))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactionArena: UserArena.Transaction.t) => {
            expect(transactionArena.tagged).toEqual({});
            expect(transactionArena.conflicts).toEqual([]);
            expect(transactionArena.untagged).toEqual([]);
            expect(transactionArena.total).toEqual(0);
          }
      )
  )();
});

it("can materialize virtual", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(arena)(name)))
    , TE.bind("transactionArena", () => wrap((arena) => UserArena.materializeVirtual(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ bucket, transactionArena }) => {
            expect(transactionArena.tagged).toEqual({
              [bucket.id]: { transactions: [], total: 0 }
            });
            expect(transactionArena.conflicts).toEqual([]);
            expect(transactionArena.untagged).toEqual([]);
            expect(transactionArena.total).toEqual(0);
          }
      )
  )();
});

it("can materialize empty virtual", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserArena.materializeVirtual(pool)(arena))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactionArena: UserArena.Transaction.t) => {
            expect(transactionArena.tagged).toEqual({});
            expect(transactionArena.conflicts).toEqual([]);
            expect(transactionArena.untagged).toEqual([]);
            expect(transactionArena.total).toEqual(0);
          }
      )
  )();
});

it("can materialize physical and 1 transaction", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializePhysical(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ account, materialized }) => {
            expect(materialized.tagged[account.account.id]).toEqual(expect.objectContaining({
                transactions: expect.arrayContaining([expect.objectContaining({ amount: 100, merchantName: "Test Merchant", description: "A purchase" })])
              , total: 100
            }));
            expect(materialized.conflicts).toEqual([]);
            expect(materialized.total).toEqual(100);
          }
      )
  )();
});

it("can materialize virtual and 1 transaction and no rules", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucketName = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket", () => wrap((arena) => UserResource.Bucket.create(pool)(arena)(bucketName)))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializeVirtual(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ bucket, materialized }) => {
            expect(materialized.tagged).toEqual({
              [bucket.id]: { transactions: [], total: 0 }
            });
            expect(materialized.conflicts).toEqual([]);
            expect(materialized.untagged).toEqual(expect.arrayContaining([
              expect.objectContaining({ amount: 100, merchantName: "Test Merchant", description: "A purchase" })
            ]));
            expect(materialized.total).toEqual(0);
          }
      )
  )();
});

it("can materialize mutliple buckets", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucket1 = `test-${crypto.randomUUID()}`;
  const bucket2 = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket1", () => wrap((arena) => UserResource.Bucket.create(pool)(arena)(bucket1)))
    , TE.bind("bucket2", () => wrap((arena) => UserResource.Bucket.create(pool)(arena)(bucket2)))
    , TE.bind("rule", ({ transaction, bucket1, bucket2 }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(arena)(transaction.id, [{ bucket: bucket1.id, value: 1 }], bucket2.id)))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializeVirtual(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ bucket1, bucket2, materialized }) => {
            expect(materialized.tagged[bucket1.id]).toEqual(expect.objectContaining({
                transactions: expect.arrayContaining([expect.objectContaining({ amount: 1, merchantName: "Test Merchant", description: "A purchase" })])
              , total: 1
            }));
            expect(materialized.tagged[bucket2.id]).toEqual(expect.objectContaining({
                transactions: expect.arrayContaining([expect.objectContaining({ amount: 99, merchantName: "Test Merchant", description: "A purchase" })])
              , total: 99

            }));
            expect(materialized.conflicts).toEqual([]);
            expect(materialized.untagged).toEqual([]);
            expect(materialized.total).toEqual(100);
          }
      )
  )();
});

it("can materialize rule over amount", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucket1 = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket1", () => wrap((arena) => UserResource.Bucket.create(pool)(arena)(bucket1)))
    , TE.bind("rule", ({ transaction, bucket1 }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(arena)(transaction.id, [{ bucket: bucket1.id, value: 101 }], bucket1.id)))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializeVirtual(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ bucket1, materialized }) => {
            expect(materialized.tagged[bucket1.id]).toEqual(expect.objectContaining({
                transactions: expect.arrayContaining([expect.objectContaining({ amount: 100, merchantName: "Test Merchant", description: "A purchase" })])
              , total: 100
            }));
            expect(materialized.conflicts).toEqual([]);
            expect(materialized.untagged).toEqual([]);
            expect(materialized.total).toEqual(100);
          }
      )
  )();
});

it("can materialize conflict", async () => {
  const name = `test-${crypto.randomUUID()}`;
  const bucket1 = `test-${crypto.randomUUID()}`;
  const bucket2 = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("bucket1", () => wrap((arena) => UserResource.Bucket.create(pool)(arena)(bucket1)))
    , TE.bind("bucket2", () => wrap((arena) => UserResource.Bucket.create(pool)(arena)(bucket2)))
    , TE.bind("rule1", ({ transaction, bucket1, bucket2 }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(arena)(transaction.id, [{ bucket: bucket1.id, value: 1 }], bucket2.id)))
    , TE.bind("rule2", ({ transaction, bucket1, bucket2 }) => wrap((arena) => UserResource.Rule.splitTransaction(pool)(arena)(transaction.id, [{ bucket: bucket1.id, value: 99 }], bucket2.id)))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializeVirtual(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ bucket1, bucket2, rule1, rule2, materialized }) => {
            expect(materialized.tagged).toEqual({
                [bucket1.id]: { transactions: [], total: 0 }
              , [bucket2.id]: { transactions: [], total: 0 }
            })
            expect(materialized.conflicts).toEqual(expect.arrayContaining([
              {
                _type: "Conflict",
                element: expect.objectContaining({ amount: 100, merchantName: "Test Merchant", description: "A purchase" }),
                rules: expect.arrayContaining(A.map((rule: any) => rule.rule)([rule1, rule2]))
              }
            ]));
            expect(materialized.untagged).toEqual([]);
            expect(materialized.total).toEqual(0);
          }
      )
  )();
});
