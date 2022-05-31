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

const pool = new Pool();
let user: User.Internal.t;
beforeAll(async () => {
  const id = crypto.randomUUID();
  const email = `test-${crypto.randomUUID()}`;

  await TE.match(
      (error: Exception.t) => { throw new Error(`Failed with ${error}`); }
    , (newUser: User.Internal.t) => user = newUser
  )(UserResource.create(pool)({ id: id, email: email, password: "foobar", role: User.DEFAULT_ROLE }))();
});

type Wrapped<T> = (arena: UserArena.t) => TE.TaskEither<Exception.t, T>;
const wrap = <T>(func: Wrapped<T>): TE.TaskEither<Exception.t, T> => {
  return pipe(
      UserArena.fromId(pool)(crypto.randomUUID())(user.id)
    , TE.chain((arena: UserArena.t) => func(arena))
  );
}

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
