import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as T from "fp-ts/Task";
import { pipe } from "fp-ts/lib/pipeable";

import { Plaid, Pipe, Exception } from "../magic";
import { SourceFrontend, IntegrationFrontend, TransactionFrontend, NotificationFrontend } from "../storage";
import { Source, Integration, Transaction, Notification } from "../model";

export type Context = {
  source: Source.Internal.t;
  integration: Integration.Internal.t;
};

export type PullerException = "NoWork" | Exception.t;

export const accessToken = (integration: Integration.Internal.t) => {
  switch (integration.credentials._type) {
    case "Plaid":
      return integration.credentials.accessToken;
    case "Null":
      return "";
  }
}

export const notifyFailure = (pool: Pool) => (log: Logger) => (userId: string) => (exception: PullerException): TE.TaskEither<PullerException, Boolean> => {
  switch (exception) {
    case "NoWork":
      return TE.of(true);
    default:
      return pipe(
          Notification.Frontend.Create.pullerFailure(userId)(<Exception.t>exception)
        , NotificationFrontend.create(pool)(log)
        , TE.map(() => true)
      );
  }
}

export const notifySuccess = (pool: Pool) => (log: Logger) => (userId: string) => (count: number): TE.TaskEither<PullerException, Boolean> => {
  return pipe(
      Notification.Frontend.Create.newTransactions(userId)(count)
    , NotificationFrontend.create(pool)(log)
    , TE.map(() => true)
  );
}

export const withIntegration = (pool: Pool) => (log: Logger) => (source: Source.Internal.t): TE.TaskEither<PullerException, Context> => {
  // at this point, an integration id must exist
  const integrationId = O.match(() => "", (integrationId: string) => integrationId)(source.integrationId);
  return pipe(
      integrationId
    , IntegrationFrontend.getById(pool)(log)
    , TE.mapLeft((error) => {
        log.error(error);
        return <PullerException>"Exception";
      })
    , TE.map((integration) => ({ source: source, integration: integration }))
  );
}

export const pushTransactions = (pool: Pool) => (log: Logger) => (id: string) => (transactions: Transaction.Internal.t[]): TE.TaskEither<PullerException, void> => {
  log.info(`Scheduler.puller[${id}] - pushing ${transactions.length} transactions`)
  const push = (transaction: Transaction.Internal.t): TE.TaskEither<PullerException, void> => {
    return pipe(
        transaction
      , TransactionFrontend.create(pool)(log)
      , TE.mapLeft((error) => {
          log.error(error);
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
