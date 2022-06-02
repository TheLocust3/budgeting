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
