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

it("can resolve integrations", async () => {
  await pipe(
      wrap((arena) => UserArena.integrations(pool)(arena))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrationArena: UserArena.Integrations.t) => {
            expect(integrationArena).toEqual(expect.arrayContaining([
              expect.objectContaining({
                integration: expect.objectContaining({ name: "Manual Sources" }),
                sources: []
              })
            ]));
          }
      )
  )();
});

it("can create manual source", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Account.create(pool)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.integrations(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrationArena: UserArena.Integrations.t) => {
            expect(integrationArena).toEqual(expect.arrayContaining([
              expect.objectContaining({
                integration: expect.objectContaining({ name: "Manual Sources" }),
                sources: expect.arrayContaining([
                  expect.objectContaining({ name: name })
                ])
              })
            ]));
          }
      )
  )();
});

it("can delete manual source", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Account.create(pool)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.integrations(pool)(arena)))
    , TE.chain((integrationsArena) => wrap((arena) => UserResource.Source.remove(pool)(arena)(integrationsArena[0].sources[0].id)))
    , TE.chain(() => wrap((arena) => UserArena.integrations(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrationArena: UserArena.Integrations.t) => {
            expect(integrationArena).toEqual(expect.arrayContaining([
              expect.objectContaining({
                integration: expect.objectContaining({ name: "Manual Sources" }),
                sources: []
              })
            ]));
          }
      )
  )();
});

it("can't delete unknown manual source", async () => {
  const name = `test-${crypto.randomUUID()}`;

  await pipe(
      wrap((arena) => UserResource.Account.create(pool)(arena)(name))
    , TE.chain(() => wrap((arena) => UserArena.integrations(pool)(arena)))
    , TE.chain((integrationsArena) => wrap((arena) => UserResource.Source.remove(pool)(arena)("nonsense")))
    , TE.match(
          (error: Exception.t) => { expect(error).toEqual(Exception.throwNotFound) }
        , () => { throw new Error(`Should not have been able to delete source`); }
      )
  )();
});

it("can create an integration", async () => {
  const institution = `test-institution-${crypto.randomUUID()}`;

  const request = { institutionName: institution, accounts: [{ id: "1jPv69G6mvuQoNlzN1GDcoDb3l3W94sZJRELd", name: "Plaid Checking" }] };
  const publicToken = { item_id: "aaow6mM69wF5dglVgbXLi9nlBnNre5u7PmBZx", access_token: "access-sandbox-d37975d9-1dbe-40b6-b34c-4073fe131e05" }

  await pipe(
      wrap((arena) => UserResource.Integration.create(pool)(plaidClient)(arena)(request)(publicToken))
    , TE.chain(() => wrap((arena) => UserArena.integrations(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrationArena: UserArena.Integrations.t) => {
            expect(integrationArena).toEqual(expect.arrayContaining([
              expect.objectContaining({
                integration: expect.objectContaining({ name: institution }),
                sources: expect.arrayContaining([
                  expect.objectContaining({ name: "Plaid Checking" })
                ])
              }),
              expect.objectContaining({
                integration: expect.objectContaining({ name: "Manual Sources" }),
                sources: []
              })
            ]));
          }
      )
  )();
});

it("can create an integration and create account", async () => {
  const institution = `test-institution-${crypto.randomUUID()}`;

  const request = { institutionName: institution, accounts: [{ id: "1jPv69G6mvuQoNlzN1GDcoDb3l3W94sZJRELd", name: "Plaid Checking" }] };
  const publicToken = { item_id: "aaow6mM69wF5dglVgbXLi9nlBnNre5u7PmBZx", access_token: "access-sandbox-d37975d9-1dbe-40b6-b34c-4073fe131e05" }

  await pipe(
      wrap((arena) => UserResource.Integration.create(pool)(plaidClient)(arena)(request)(publicToken))
    , TE.chain(() => wrap((arena) => UserArena.physical(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accountArena: UserArena.Account.t) => {
            expect(accountArena).toEqual(expect.objectContaining({ children: expect.arrayContaining([
              expect.objectContaining({ account: expect.objectContaining({ name: "Plaid Checking" }) })
            ])}));
          }
      )
  )();
});

it("can create an integration and rollup initial balance", async () => {
  const institution = `test-institution-${crypto.randomUUID()}`;

  const request = { institutionName: institution, accounts: [{ id: "1jPv69G6mvuQoNlzN1GDcoDb3l3W94sZJRELd", name: "Plaid Checking" }] };
  const publicToken = { item_id: "aaow6mM69wF5dglVgbXLi9nlBnNre5u7PmBZx", access_token: "access-sandbox-d37975d9-1dbe-40b6-b34c-4073fe131e05" }

  await pipe(
      wrap((arena) => UserResource.Integration.create(pool)(plaidClient)(arena)(request)(publicToken))
    , TE.chain(() => wrap((arena) => UserArena.materializePhysical(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactionArena: UserArena.Transaction.t) => {
            expect(transactionArena.tagged[Object.keys(transactionArena.tagged)[0]]).toEqual(expect.objectContaining({
              transactions: expect.arrayContaining([expect.objectContaining({ amount: 110, "description": "Starting balance" })])
            }));
          }
      )
  )();
});
