import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid, MetadataBuilder } from "./util";

const sourceId = `source-${uuid()}`;

let system: System;
beforeAll(() => {
  system = new System();
});

it("can add transaction", async () => {
  const merchantName = `test-${uuid()}`;
  const authorizedAt = new Date();
  await pipe(
      system.addTransaction(sourceId, "user", 10, merchantName, "test description", authorizedAt, O.none, MetadataBuilder.plaid)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction: any) => {
            expect(transaction).toEqual(expect.objectContaining({
                sourceId: sourceId
              , userId: "user"
              , amount: 10
              , merchantName: merchantName
              , description: "test description"
              , authorizedAt: authorizedAt.toJSON()
              , metadata: MetadataBuilder.plaid
            }));
            expect(typeof transaction.id).toBe("string");
          }
      )
  )();
});

it("can add transaction with capturedAt", async () => {
  const merchantName = `test-${uuid()}`;
  const authorizedAt = new Date();
  const capturedAt = new Date();
  await pipe(
      system.addTransaction(sourceId, "user", 10, merchantName, "test description", authorizedAt, O.some(capturedAt), MetadataBuilder.plaid)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction: any) => {
            expect(transaction).toEqual(expect.objectContaining({
                sourceId: sourceId
              , userId: "user"
              , amount: 10
              , merchantName: merchantName
              , description: "test description"
              , authorizedAt: authorizedAt.toJSON()
              , capturedAt: O.some(capturedAt.toJSON())
              , metadata: MetadataBuilder.plaid
            }));
            expect(typeof transaction.id).toBe("string");
          }
      )
  )();
});

it("can get transaction", async () => {
  const merchantName = `test-${uuid()}`;
  const authorizedAt = new Date();
  const capturedAt = new Date();
  await pipe(
      system.addTransaction(sourceId, "user", 10, merchantName, "test description", authorizedAt, O.some(capturedAt), MetadataBuilder.plaid)
    , TE.chain((transaction) => system.getTransaction(transaction.id))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (_transaction) => {
            const transaction = _transaction.transaction;
            expect(transaction).toEqual(expect.objectContaining({
                sourceId: sourceId
              , userId: "user"
              , amount: 10
              , merchantName: merchantName
              , description: "test description"
              , authorizedAt: authorizedAt.toJSON()
              , capturedAt: O.some(capturedAt.toJSON())
              , metadata: MetadataBuilder.plaid
            }));
            expect(typeof transaction.id).toBe("string");
          }
      )
  )();
});

it("can list transactions", async () => {
  const merchantName = `test-${uuid()}`;
  const authorizedAt = new Date();
  const capturedAt = new Date();
  await pipe(
      system.addTransaction(sourceId, "user", 10, merchantName, "test description", authorizedAt, O.some(capturedAt), MetadataBuilder.plaid)
    , TE.chain((_) => system.listTransactions())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.transactions.filter((transaction: any) => transaction.merchantName === merchantName)[0];

            expect(transaction).toEqual(expect.objectContaining({
                sourceId: sourceId
              , userId: "user"
              , amount: 10
              , merchantName: merchantName
              , description: "test description"
              , authorizedAt: authorizedAt.toJSON()
              , capturedAt: O.some(capturedAt.toJSON())
              , metadata: MetadataBuilder.plaid
            }));
            expect(typeof transaction.id).toBe("string");
          }
      )
  )();
});

it("can delete transaction", async () => {
  const merchantName = `test-${uuid()}`;
  const authorizedAt = new Date();
  const capturedAt = new Date();
  await pipe(
      system.addTransaction(sourceId, "user", 10, merchantName, "test description", authorizedAt, O.some(capturedAt), MetadataBuilder.plaid)
    , TE.chain((transaction) => system.deleteTransaction(transaction.id))
    , TE.chain((_) => system.listTransactions())
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.transactions.filter((transaction: any) => transaction.merchantName === merchantName);

            expect(transaction.length).toEqual(0);
          }
      )
  )();
});
