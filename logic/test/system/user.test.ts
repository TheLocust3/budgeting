import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid } from "./util";

let system: System;
beforeAll(async () => {
  system = new System();
});

it("can add user", async () => {
  const email = `test-${uuid()}`;
  await pipe(
      system.addUser(email, "foobar")
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (user: any) => {
            expect(user).toEqual(expect.objectContaining({ email: email }));
            expect(typeof user.id).toBe("string");
            expect(user.password).not.toBe("foobar");
          }
      )
  )();
});

it("can successfully login", async () => {
  const email = `test-${uuid()}`;
  await pipe(
      system.addUser(email, "foobar")
    , TE.chain((_) => system.login(email, "foobar"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (token: any) => {
            expect(typeof token.token).toBe("string");
          }
      )
  )();
});

it("can't log into account with wrong email", async () => {
  const email = `test-${uuid()}`;
  await pipe(
      system.addUser(email, "foobar")
    , TE.chain((_) => system.login("test", "foobar"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (res) => { expect(res.message).toBe("failed"); }
      )
  )();
});

it("can't log into account with wrong password", async () => {
  const email = `test-${uuid()}`;
  await pipe(
      system.addUser(email, "foobar")
    , TE.chain((_) => system.login(email, "foobar123"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (res) => { expect(res.message).toBe("failed"); }
      )
  )();
});
