import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { Source } from "../../model";
import { Exception } from "../../magic";
export declare namespace SourceFrontend {
    const all: (pool: Pool) => (userId: string) => TE.TaskEither<Exception.t, Source.Internal.t[]>;
    const getById: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Exception.t, Source.Internal.t>;
    const allByIntegrationId: (pool: Pool) => (userId: string) => (integrationId: string) => TE.TaskEither<Exception.t, Source.Internal.t[]>;
    const create: (pool: Pool) => (source: Source.Frontend.Create.t) => TE.TaskEither<Exception.t, Source.Internal.t>;
    const deleteById: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Exception.t, void>;
    const pull: (pool: Pool) => () => TE.TaskEither<Exception.t, Source.Internal.t>;
    const pullForRollup: (pool: Pool) => () => TE.TaskEither<Exception.t, Source.Internal.t>;
}
export default SourceFrontend;
