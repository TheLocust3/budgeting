import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import { GLOBAL_ACCOUNT, PHYSICAL_ACCOUNT, VIRTUAL_ACCOUNT } from "./constants";

import { UserFrontend, AccountFrontend, RuleFrontend } from "storage";
import { Rule } from "model";

const createUser = (pool: Pool) => (email: string, password: string, role: string) => {
  return pipe(
      UserFrontend.getByEmail(pool)(email)
    , TE.orElse(() => UserFrontend.create(pool)({ email: email, password: password, role: role }))
  );
}

const migrate = async (pool: Pool) => {
  await pipe(
      TE.Do
    , TE.bind("user", () => createUser(pool)("jake.kinsella@gmail.com", "foobar", "superuser"))
    , TE.bind("globalAccount", ({ user }) => AccountFrontend.create(pool)({ parentId: O.none, userId: user.id, name: GLOBAL_ACCOUNT }))
    , TE.bind("globalRule", ({ user, globalAccount }) => {
        return RuleFrontend.create(pool)({
            accountId: globalAccount.id
          , userId: user.id
          , rule: <Rule.Internal.Rule>{ _type: "Include", where: { _type: "StringMatch", field: "userId", operator: "Eq", value: user.id } }
        });
      })
    , TE.bind("physicalAccount", ({ user, globalAccount }) => AccountFrontend.create(pool)({ parentId: O.some(globalAccount.id), userId: user.id, name: PHYSICAL_ACCOUNT }))
    , TE.bind("virtualAccount", ({ user, globalAccount }) => AccountFrontend.create(pool)({ parentId: O.some(globalAccount.id), userId: user.id, name: VIRTUAL_ACCOUNT }))
    , TE.bind("allyBank", ({ user, physicalAccount }) => AccountFrontend.create(pool)({ parentId: O.some(physicalAccount.id), userId: user.id, name: "Ally Bank" }))
    , TE.bind("petalCard", ({ user, physicalAccount }) => AccountFrontend.create(pool)({ parentId: O.some(physicalAccount.id), userId: user.id, name: "Petal Card" }))
    , TE.map(({ user }) => {
        console.log(`User created ${user.email}`)
      })
    , TE.mapLeft((error) => {
        console.log(`User creation failed`)
        console.log(error)
      })
  )();

  console.log("Migrate complete");
  process.exit(0);
};

console.log("Migrate start");

export const pool = new Pool();
migrate(pool);

