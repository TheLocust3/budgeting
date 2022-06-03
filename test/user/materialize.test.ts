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
      wrap((arena) => UserResource.Account.create(pool)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.materializePhysical(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactionArena: UserArena.Transaction.t) => {
            expect(transactionArena.tagged).toEqual({});
            expect(transactionArena.conflicts).toEqual([]);
            expect(transactionArena.untagged).toEqual([]);
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
          }
      )
  )();
});

it("can materialize virtual", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Bucket.create(pool)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.materializeVirtual(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactionArena: UserArena.Transaction.t) => {
            expect(transactionArena.tagged).toEqual({});
            expect(transactionArena.conflicts).toEqual([]);
            expect(transactionArena.untagged).toEqual([]);
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
            expect(materialized.tagged[account.account.id]).toEqual(expect.arrayContaining([
              expect.objectContaining({ amount: 100, merchantName: "Test Merchant", description: "A purchase" })
            ]))
            expect(materialized.conflicts).toEqual([]);
          }
      )
  )();
});

it("can materialize virtual and 1 transaction and no rules", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("materialized", () => wrap((arena) => UserArena.materializeVirtual(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ account, materialized }) => {
            expect(materialized.tagged).toEqual({});
            expect(materialized.conflicts).toEqual([]);
            expect(materialized.untagged).toEqual(expect.arrayContaining([
              expect.objectContaining({ amount: 100, merchantName: "Test Merchant", description: "A purchase" })
            ]));
          }
      )
  )();
});
