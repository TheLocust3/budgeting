import crypto from "crypto";
import { Pool } from "pg";
import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { UserArena, UserResource } from "../../src/user";
import { UserFrontend } from "../../src/storage";
import { User } from "../../src/model";

const pool = new Pool();

it("can create empty user and login", async () => {
  const id = crypto.randomUUID();
  const email = `test-${crypto.randomUUID()}`;

  await pipe(
      UserResource.create(pool)({ id: id, email: email, password: "foobar", role: User.DEFAULT_ROLE })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (user: User.Internal.t) => {
            expect(user).toEqual(expect.objectContaining({ id: id, email: email, role: User.DEFAULT_ROLE }));
          }
      )
  )();
});

it("can login", async () => {
  const id = crypto.randomUUID();
  const email = `test-${crypto.randomUUID()}`;

  await pipe(
      UserResource.create(pool)({ id: id, email: email, password: "foobar", role: User.DEFAULT_ROLE })
    , TE.chain(() => UserFrontend.login(pool)(email, "foobar"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (user: User.Internal.t) => {
            expect(user).toEqual(expect.objectContaining({ id: id, email: email, role: User.DEFAULT_ROLE }));
          }
      )
  )();
});
