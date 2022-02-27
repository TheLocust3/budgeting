import { Pool } from "pg";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import { Plaid, Pipe } from "magic";
import { SourceFrontend, IntegrationFrontend, TransactionFrontend } from "storage";
import { Source, Integration, Transaction } from "model";

export type Context = {
  source: Source.Internal.t;
  integration: Integration.Internal.t;
};

export type PullerException = "NoWork" | "Exception";

export const withIntegration = (pool: Pool) => (source: Source.Internal.t): TE.TaskEither<PullerException, Context> => {
  // at this point, an integration id must exist
  const integrationId = O.match(() => "", (integrationId: string) => integrationId)(source.integrationId);
  return pipe(
      integrationId
    , IntegrationFrontend.getById(pool)
    , TE.mapLeft((error) => {
        console.log(error);
        return <PullerException>"Exception";
      })
    , TE.map((integration) => ({ source: source, integration: integration }))
  );
}

export const pushTransactions = (pool: Pool) => (id: string) => (transactions: Transaction.Internal.t[]): TE.TaskEither<PullerException, void> => {
  console.log(`Scheduler.puller[${id}] - pushing ${transactions.length} transactions`)
  const push = (transaction: Transaction.Internal.t): TE.TaskEither<PullerException, void> => {
    return pipe(
        transaction
      , TransactionFrontend.create(pool)
      , TE.mapLeft((error) => {
          console.log(error);
          return <PullerException>"Exception";
        })
      , TE.map((_) => { return; })
    );
  }

  return pipe(
      transactions
    , A.map(push)
    , A.sequence(TE.ApplicativeSeq)
    , TE.map((_) => { return; })
  );
}
