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
import { User } from "../../src/model";
import { Exception } from "../../src/magic";

import { pool, wrapperBuilder, Wrapper } from './util';

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

it("can resolve physical accounts", async () => {
  await pipe(
      wrap((arena) => UserArena.physical(pool)(arena))
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
      wrap((arena) => UserArena.virtual(pool)(arena))
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
      wrap((arena) => UserResource.Account.create(pool)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.physical(pool)(arena)))
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
      wrap((arena) => UserResource.Account.create(pool)(arena)(name))
    , TE.chain(({ account }) => wrap((arena) => UserResource.Account.remove(pool)(arena)(account.id)))
    , TE.chain(() => wrap((arena) => UserArena.physical(pool)(arena)))
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
      wrap((arena) => UserResource.Account.create(pool)(arena)(name))
    , TE.chain(({ account }) => wrap((arena) => UserResource.Account.remove(pool)(arena)("nonsense")))
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
      wrap((arena) => UserResource.Bucket.create(pool)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.virtual(pool)(arena)))
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
      wrap((arena) => UserResource.Bucket.create(pool)(arena)(name))
    , TE.chain((account) => wrap((arena) => UserResource.Account.remove(pool)(arena)(account.id)))
    , TE.match(
          (error: Exception.t) => { expect(error._type).toEqual("ValidationError") }
        , () => { throw new Error(`Should not have been able to delete bucket`); }
      )
  )();
});
