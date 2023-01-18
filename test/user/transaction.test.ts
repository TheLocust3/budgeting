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

it("can't delete unknown transaction", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction(account.source.id))))
    , TE.bind("deleted", () => wrap((arena) => UserResource.Transaction.remove(pool)(log)(arena)("unknown")))
    , TE.match(
          (error: Exception.t) => { expect(error).toEqual(Exception.throwNotFound) }
        , () => { throw new Error(`Should not have been able to delete transaction`); }
      )
  )();
});

it("can't create transaction with unknown source", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      TE.Do
    , TE.bind("account", () => wrap((arena) => UserResource.Account.create(pool)(log)(arena)(name)))
    , TE.bind("transaction", ({ account }) => wrap((arena) => UserResource.Transaction.create(pool)(log)(arena)(sampleTransaction("nonsense"))))
    , TE.match(
          (error: Exception.t) => { expect(error.name).toEqual("ValidationError") }
        , () => { throw new Error(`Should not have been able to create transaction`); }
      )
  )();
});
