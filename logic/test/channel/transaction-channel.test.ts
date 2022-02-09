import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { TransactionChannel } from "../../src/channel";
import { uuid } from "../system/util";

const testTransaction = {
    sourceId: "sourceId"
  , userId: "test"
  , amount: 10
  , merchantName: "merchant name"
  , description: "description"
  , authorizedAt: new Date()
  , capturedAt: O.none
  , metadata: {}
  , custom: {}
};

const expectTransaction = testTransaction;

it("can add transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionChannel.create({ ...testTransaction, id: "", merchantName: merchantName })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction) => {
            expect(transaction).toEqual(expect.objectContaining({ ...expectTransaction, merchantName: merchantName }));
            expect(transaction.id).not.toBe("");
          }
      )
  )();
});

it("can get transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionChannel.create({ ...testTransaction, id: "", merchantName: merchantName })
    , TE.chain((transaction) => TransactionChannel.getById(transaction.userId)(transaction.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction) => {
            expect(transaction).toEqual(expect.objectContaining({ ...expectTransaction, merchantName: merchantName }));
            expect(transaction.id).not.toBe("");
          }
      )
  )();
});

it("can't get other user's transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionChannel.create({ ...testTransaction, id: "", merchantName: merchantName })
    , TE.chain((transaction) => TransactionChannel.getById("test2")(transaction.id))
    , TE.match(
          (res) => { expect(res._type).toBe("NotFound"); }
        , (_) => { throw new Error("Got unexpected successful response"); }
      )
  )();
});

it("can list transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionChannel.create({ ...testTransaction, id: "", merchantName: merchantName })
    , TE.chain((_) => TransactionChannel.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.filter((transaction) => transaction.merchantName === merchantName)[0];

            expect(transaction).toEqual(expect.objectContaining({ ...expectTransaction, merchantName: merchantName }));
            expect(transaction.id).not.toBe("");

            transactions.map((transaction) => expect(transaction.userId).toBe("test"));
          }
      )
  )();
});

it("can delete transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionChannel.create({ ...testTransaction, id: "", merchantName: merchantName })
    , TE.chain((transaction) => TransactionChannel.deleteById("test")(transaction.id))
    , TE.chain((_) => TransactionChannel.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.filter((transaction) => transaction.merchantName === merchantName);

            expect(transaction.length).toEqual(0);
          }
      )
  )();
});

it("can't delete other user's transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionChannel.create({ ...testTransaction, id: "", userId: "test2", merchantName: merchantName })
    , TE.chain((transaction) => TransactionChannel.deleteById("test")(transaction.id))
    , TE.chain((_) => TransactionChannel.all("test2"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.filter((transaction) => transaction.merchantName === merchantName)[0];

            expect(transaction).toEqual(expect.objectContaining({ merchantName: merchantName }));
            expect(transaction.id).not.toBe("");
          }
      )
  )();
});
