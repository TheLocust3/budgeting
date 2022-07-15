import crypto from "crypto";
import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { UserArena, UserResource } from "../../src/user";
import { NotificationFrontend } from "../../src/storage";
import { User, Notification } from "../../src/model";
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

it("can list notifications", async () => {
  await pipe(
      NotificationFrontend.create(pool)(Notification.Frontend.Create.newTransactions(user.id)(1))
    , TE.chain(() => wrap((arena) => UserArena.notifications(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (notifications) => {
            expect(notifications).toEqual(expect.arrayContaining([
              expect.objectContaining({
                  acked: false
                , metadata: { _type: "NewTransactions" }
              })
            ]));
          }
      )
  )();
});

it("can ack notification", async () => {
  await pipe(
      NotificationFrontend.create(pool)(Notification.Frontend.Create.newTransactions(user.id)(1))
    , TE.chain((notification) => wrap((arena) => UserResource.Notification.ack(pool)(arena)(notification.id)))
    , TE.chain(() => wrap((arena) => UserArena.notifications(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (notifications) => {
            expect(notifications).toEqual(expect.arrayContaining([
              expect.objectContaining({
                  acked: true
                , metadata: { _type: "NewTransactions" }
              })
            ]));
          }
      )
  )();
});

it("can delete notification", async () => {
  await pipe(
      NotificationFrontend.create(pool)(Notification.Frontend.Create.newTransactions(user.id)(1))
    , TE.chain((notification) => wrap((arena) => UserResource.Notification.remove(pool)(arena)(notification.id)))
    , TE.chain(() => wrap((arena) => UserArena.notifications(pool)(arena)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (notifications) => {
            expect(notifications).toEqual([]);
          }
      )
  )();
});
