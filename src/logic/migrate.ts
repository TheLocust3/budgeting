import crypto from "crypto";
import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { GLOBAL_ACCOUNT, PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "./constants";

import { UserFrontend, AccountFrontend, RuleFrontend } from "../storage";
import { Rule } from "../model";

const createUser = (pool: Pool) => (email: string, password: string, role: string) => {
  return pipe(
      UserFrontend.getByEmail(pool)(email)
    , TE.orElse(() => UserFrontend.create(pool)({ id: crypto.randomUUID(), email: email, password: password, role: role }))
  );
}

export const migrate = async (pool: Pool) => {
  await pipe(
      TE.Do
    , TE.bind("user", () => createUser(pool)("admin", "foobar", "superuser"))
    , TE.map(({ user }) => {
        console.log(`User created ${user.email}`)
      })
    , TE.mapLeft((error) => {
        console.log(`User creation failed`)
        console.log(error)
      })
  )();
};

