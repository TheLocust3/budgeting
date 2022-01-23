import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import TransactionFrontend from "../../src/frontend/transaction-frontend";
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

const expectTransaction = {
    ...testTransaction
  , authorizedAt: testTransaction.authorizedAt.toJSON()
};

it("can add transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionFrontend.create({ ...testTransaction, id: O.none, merchantName: merchantName })
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction) => {
            expect(transaction).toEqual(expect.objectContaining({ ...expectTransaction, merchantName: merchantName }));
            expect(O.isSome(transaction.id)).toBe(true);
          }
      )
  )();
});

it("can get transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionFrontend.create({ ...testTransaction, id: O.none, merchantName: merchantName })
    , TE.chain((transaction) => TransactionFrontend.getById(transaction.userId)(O.match(() => "", (transaction: string) => transaction)(transaction.id)))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction) => {
            expect(transaction).toEqual(expect.objectContaining({ ...expectTransaction, merchantName: merchantName }));
            expect(O.isSome(transaction.id)).toBe(true);
          }
      )
  )();
});

it("can't get other user's transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionFrontend.create({ ...testTransaction, id: O.none, merchantName: merchantName })
    , TE.chain((transaction) => TransactionFrontend.getById("test2")(O.match(() => "", (transaction: string) => transaction)(transaction.id)))
    , TE.match(
          (res) => { expect(res._type).toBe("NotFound"); }
        , (_) => { throw new Error("Got unexpected successful response"); }
      )
  )();
});

it("can list transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionFrontend.create({ ...testTransaction, id: O.none, merchantName: merchantName })
    , TE.chain((_) => TransactionFrontend.all("test"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.filter((transaction) => transaction.merchantName === merchantName)[0];

            expect(transaction).toEqual(expect.objectContaining({ ...expectTransaction, merchantName: merchantName }));
            expect(O.isSome(transaction.id)).toBe(true);

            transactions.map((transaction) => expect(transaction.userId).toBe("test"));
          }
      )
  )();
});

it("can delete transaction", async () => {
  const merchantName = `test-${uuid()}`;
  await pipe(
      TransactionFrontend.create({ ...testTransaction, id: O.none, merchantName: merchantName })
    , TE.chain((transaction) => TransactionFrontend.deleteById("test")(O.match(() => "", (transaction: string) => transaction)(transaction.id)))
    , TE.chain((_) => TransactionFrontend.all("test"))
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
      TransactionFrontend.create({ ...testTransaction, id: O.none, userId: "test2", merchantName: merchantName })
    , TE.chain((transaction) => TransactionFrontend.deleteById("test")(O.match(() => "", (transaction: string) => transaction)(transaction.id)))
    , TE.chain((_) => TransactionFrontend.all("test2"))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.filter((transaction) => transaction.merchantName === merchantName)[0];

            expect(transaction).toEqual(expect.objectContaining({ merchantName: merchantName }));
            expect(O.isSome(transaction.id)).toBe(true);
          }
      )
  )();
});
