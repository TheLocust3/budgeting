import { pipe } from "fp-ts/lib/pipeable";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

import { System, uuid, MetadataBuilder } from "./util";

let system: System;
let sourceId: string;
beforeAll(async () => {
  system = await System.build();
  sourceId = await system.buildTestSource();
});

it("can add transaction", async () => {
  const merchantName = `test-${uuid()}`;
  const authorizedAt = new Date();
  await pipe(
      system.addTransaction(sourceId, system.userId, 10, merchantName, "test description", authorizedAt, O.none, MetadataBuilder.plaid)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction: any) => {
            expect(transaction).toEqual(expect.objectContaining({
                sourceId: sourceId
              , userId: system.userId
              , amount: 10
              , merchantName: merchantName
              , description: "test description"
              , authorizedAt: authorizedAt
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
      system.addTransaction(sourceId, system.userId, 10, merchantName, "test description", authorizedAt, O.some(capturedAt), MetadataBuilder.plaid)
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction: any) => {
            expect(transaction).toEqual(expect.objectContaining({
                sourceId: sourceId
              , userId: system.userId
              , amount: 10
              , merchantName: merchantName
              , description: "test description"
              , authorizedAt: authorizedAt
              , capturedAt: O.some(capturedAt)
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
      system.addTransaction(sourceId, system.userId, 10, merchantName, "test description", authorizedAt, O.some(capturedAt), MetadataBuilder.plaid)
    , TE.chain((transaction) => system.getTransaction(transaction.id, transaction.userId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transaction) => {
            expect(transaction).toEqual(expect.objectContaining({
                sourceId: sourceId
              , userId: system.userId
              , amount: 10
              , merchantName: merchantName
              , description: "test description"
              , authorizedAt: authorizedAt
              , capturedAt: O.some(capturedAt)
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
      system.addTransaction(sourceId, system.userId, 10, merchantName, "test description", authorizedAt, O.some(capturedAt), MetadataBuilder.plaid)
    , TE.chain((transaction) => system.listTransactions(transaction.userId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.filter((transaction: any) => transaction.merchantName === merchantName)[0];

            expect(transaction).toEqual(expect.objectContaining({
                sourceId: sourceId
              , userId: system.userId
              , amount: 10
              , merchantName: merchantName
              , description: "test description"
              , authorizedAt: authorizedAt
              , capturedAt: O.some(capturedAt)
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
      system.addTransaction(sourceId, system.userId, 10, merchantName, "test description", authorizedAt, O.some(capturedAt), MetadataBuilder.plaid)
    , TE.chain((transaction) => system.deleteTransaction(transaction.id, transaction.userId))
    , TE.chain((_) => system.listTransactions(system.userId))
    , TE.match(
          (error) => { throw new Error(`Failed with ${error}`); }
        , (transactions) => {
            const transaction = transactions.filter((transaction: any) => transaction.merchantName === merchantName);

            expect(transaction.length).toEqual(0);
          }
      )
  )();
});
