import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { AccountChannel } from "../../src/channel";
import { uuid } from "../system/util";

it("can add account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      AccountChannel.create({ id: "", parentId: O.none, userId: "test", name: name, rules: [], children: [] })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account) => {
            expect(account).toEqual(expect.objectContaining({ parentId: O.none, userId: "test", name: name }));
            expect(account.id).not.toBe("");
          }
      )
  )();
});

it("can get account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      AccountChannel.create({ id: "", parentId: O.none, userId: "test", name: name, rules: [], children: [] })
    , TE.chain((account) => AccountChannel.getById(account.userId)(account.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (account) => {
            expect(account).toEqual(expect.objectContaining({ parentId: O.none, userId: "test", name: name }));
            expect(account.id).not.toBe("");
          }
      )
  )();
});

it("can't get other user's account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      AccountChannel.create({ id: "", parentId: O.none, userId: "test", name: name, rules: [], children: [] })
    , TE.chain((account) => AccountChannel.getById("test2")(account.id))
    , TE.match(
          (res) => { expect(res._type).toBe("NotFound"); }
        , (_) => { throw new Error("Got unexpected successful response"); }
      )
  )();
});

it("can list account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      AccountChannel.create({ id: "", parentId: O.none, userId: "test", name: name, rules: [], children: [] })
    , TE.chain((_) => AccountChannel.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accounts) => {
            const account = accounts.filter((account) => account.name === name)[0];

            expect(account).toEqual(expect.objectContaining({ parentId: O.none, userId: "test", name: name }));
            expect(account.id).not.toBe("");

            accounts.map((account) => expect(account.userId).toBe("test"));
          }
      )
  )();
});

it("can delete account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      AccountChannel.create({ id: "", parentId: O.none, userId: "test", name: name, rules: [], children: [] })
    , TE.chain((account) => AccountChannel.deleteById("test")(account.id))
    , TE.chain((_) => AccountChannel.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accounts) => {
            const account = accounts.filter((account) => account.name === name);

            expect(account.length).toEqual(0);
          }
      )
  )();
});

it("can't delete other user's account", async () => {
  const name = `test-${uuid()}`;
  await pipe(
      AccountChannel.create({ id: "", parentId: O.none, userId: "test2", name: name, rules: [], children: [] })
    , TE.chain((account) => AccountChannel.deleteById("test")(account.id))
    , TE.chain((_) => AccountChannel.all("test2"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (accounts) => {
            const account = accounts.filter((account) => account.name === name)[0];

            expect(account).toEqual(expect.objectContaining({ name: name }));
            expect(account.id).not.toBe("");
          }
      )
  )();
});
