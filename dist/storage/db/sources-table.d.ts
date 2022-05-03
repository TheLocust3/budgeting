import { Pool } from "pg";
import * as O from "fp-ts/Option";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";
import { Source } from "../../model";
export declare const migrate: (pool: Pool) => T.Task<boolean>;
export declare const rollback: (pool: Pool) => T.Task<boolean>;
export declare const all: (pool: Pool) => (userId: string) => TE.TaskEither<Error, Source.Internal.t[]>;
export declare const byId: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Error, O.Option<Source.Internal.t>>;
export declare const byIntegrationId: (pool: Pool) => (userId: string) => (integrationId: string) => TE.TaskEither<Error, Source.Internal.t[]>;
export declare const deleteById: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Error, void>;
export declare const create: (pool: Pool) => (source: Source.Frontend.Create.t) => TE.TaskEither<Error, Source.Internal.t>;
export declare const pull: (pool: Pool) => () => TE.TaskEither<Error, O.Option<Source.Internal.t>>;
export declare const pullForRollup: (pool: Pool) => () => TE.TaskEither<Error, O.Option<Source.Internal.t>>;
