import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";

import { System, uuid } from "./util";

let system: System;
beforeAll(async () => {
  system = new System();
});

it("can delete user", async () => {
  const email = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('user', () => system.addUser(email, "foobar"))
    , TE.bind('login', () => system.login("jake.kinsella@gmail.com", "foobar"))
    , TE.bind('deleted', ({ user }) => system.deleteUser(user.id))
    , TE.bind('allUsers', () => T.delay(1000)(system.getUsers()))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ user, allUsers }) => {
            const notDeleted = allUsers.users.filter((otherUser: any) => otherUser.id === user.id);
            expect(notDeleted.length).toBe(0);
          }
      )
  )();
});

it("can't delete user if not admin", async () => {
  const email = `test-${uuid()}`;
  await pipe(
      TE.Do
    , TE.bind('user', () => system.addUser(email, "foobar"))
    , TE.bind('login', ({ user }) => system.login(user.email, "foobar"))
    , TE.bind('deleted', ({ user }) => system.deleteUser(user.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , ({ deleted }) => {
            expect(deleted.message).toBe("failed");
          }
      )
  )();
});
