import { Pool } from "pg";
import { Logger } from "pino";
import * as A from "fp-ts/Array";
import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

import RuleFrontend from "./rule-frontend";

import { Notification } from "../../model";
import * as NotificationsTable from "../db/notifications-table";
import { Exception } from "../../magic";

export namespace NotificationFrontend {
  export const all = (pool: Pool) => (log: Logger) => (userId: string): TE.TaskEither<Exception.t, Notification.Internal.t[]> => {
    return NotificationsTable.all(pool)(log)(userId);
  };

  export const create = (pool: Pool) => (log: Logger) => (notification: Notification.Frontend.Create.t): TE.TaskEither<Exception.t, Notification.Internal.t> => {
    return pipe(
        notification
      , NotificationsTable.create(pool)(log)
    );
  };

  export const deleteById = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , NotificationsTable.deleteById(pool)(log)(userId)
    );
  };

  export const ack = (pool: Pool) => (log: Logger) => (userId: string) => (id: string): TE.TaskEither<Exception.t, void> => {
    return pipe(
        id
      , NotificationsTable.ackById(pool)(log)(userId)
    );
  };
}

export default NotificationFrontend;
