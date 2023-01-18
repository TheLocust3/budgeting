import crypto from "crypto";
import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { GLOBAL_ACCOUNT, PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "./constants";

import { UserFrontend, AccountFrontend, RuleFrontend } from "../storage";
import { Rule } from "../model";

const createUser = (pool: Pool) => (log: Logger) => (id: string, email: string, role: string) => {
  return pipe(
      UserFrontend.getByEmail(pool)(log)(email)
    , TE.orElse(() => UserFrontend.create(pool)(log)({ id: id, email: email, role: role }))
  );
}

export const migrate = (pool: Pool) => async (log: Logger) => {
  await pipe(
      TE.Do
    , TE.bind("user", () => createUser(pool)(log)("F9pqIrbjf9bdxGF8H32wkRm2uRx1", "admin@jakekinsella.com", "superuser")) // TODO: JK hardcoding this seems like a bad idea
    , TE.map(({ user }) => {
        log.info(`User created ${user.email}`)
      })
    , TE.mapLeft((error) => {
        log.error(`User creation failed`)
        log.error(error)
      })
  )();
};

