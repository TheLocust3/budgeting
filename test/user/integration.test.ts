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
  )(UserResource.create(pool)({ id: id, email: email, role: User.DEFAULT_ROLE }))();

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
    , TE.chain(({ account }) => wrap((arena) => UserResource.Account.remove(pool)(arena)(account.id)))
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

it("can create an integration", async () => {
  const institution = `test-institution-${crypto.randomUUID()}`;

  const request = { institutionName: institution, accounts: [{ id: "g4ae7LlPVJukQLKNAwv1u35GRvZ6xEHLe8jDp", name: "Plaid Checking" }] };
  const publicToken = { item_id: "yGWxrZJMlbuX4QmBnpPZCJMXk97x67cy5qGXB", access_token: "access-sandbox-def2638b-c885-4211-a43a-f47aa824db0a" }

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

  const request = { institutionName: institution, accounts: [{ id: "g4ae7LlPVJukQLKNAwv1u35GRvZ6xEHLe8jDp", name: "Plaid Checking" }] };
  const publicToken = { item_id: "yGWxrZJMlbuX4QmBnpPZCJMXk97x67cy5qGXB", access_token: "access-sandbox-def2638b-c885-4211-a43a-f47aa824db0a" }

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

  const request = { institutionName: institution, accounts: [{ id: "g4ae7LlPVJukQLKNAwv1u35GRvZ6xEHLe8jDp", name: "Plaid Checking" }] };
  const publicToken = { item_id: "yGWxrZJMlbuX4QmBnpPZCJMXk97x67cy5qGXB", access_token: "access-sandbox-def2638b-c885-4211-a43a-f47aa824db0a" }

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

it("can delete a source via account", async () => {
  const institution = `test-institution-${crypto.randomUUID()}`;

  const request = { institutionName: institution, accounts: [{ id: "g4ae7LlPVJukQLKNAwv1u35GRvZ6xEHLe8jDp", name: "Plaid Checking" }] };
  const publicToken = { item_id: "yGWxrZJMlbuX4QmBnpPZCJMXk97x67cy5qGXB", access_token: "access-sandbox-def2638b-c885-4211-a43a-f47aa824db0a" }

  await pipe(
      wrap((arena) => UserResource.Integration.create(pool)(plaidClient)(arena)(request)(publicToken))
    , TE.chain(() => wrap((arena) => UserArena.physical(pool)(arena)))
    , TE.chain((accountArena) => {
        const accountId = accountArena.children[0].account.id;
        return wrap((arena) => UserResource.Account.remove(pool)(arena)(accountId));
      })
    , TE.chain(() => wrap((arena) => UserArena.integrations(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (integrationArena: UserArena.Integrations.t) => {
            expect(integrationArena).toEqual(expect.arrayContaining([
              expect.objectContaining({
                integration: expect.objectContaining({ name: institution }),
                sources: []
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

it("can delete a source via account with transactions", async () => {
  const institution = `test-institution-${crypto.randomUUID()}`;

  const request = { institutionName: institution, accounts: [{ id: "g4ae7LlPVJukQLKNAwv1u35GRvZ6xEHLe8jDp", name: "Plaid Checking" }] };
  const publicToken = { item_id: "yGWxrZJMlbuX4QmBnpPZCJMXk97x67cy5qGXB", access_token: "access-sandbox-def2638b-c885-4211-a43a-f47aa824db0a" }

  await pipe(
      wrap((arena) => UserResource.Integration.create(pool)(plaidClient)(arena)(request)(publicToken))
    , TE.chain(() => wrap((arena) => UserArena.physical(pool)(arena)))
    , TE.chain((accountArena) => {
        const accountId = accountArena.children[0].account.id;
        return wrap((arena) => UserResource.Account.remove(pool)(arena)(accountId));
      })
    , TE.chain(() => wrap((arena) => UserArena.materializePhysical(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactionArena: UserArena.Transaction.t) => {
            expect(transactionArena.tagged).toEqual({});
          }
      )
  )();
});
