import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { Integration } from "../../model";
import { Exception } from "../../magic";
export declare namespace IntegrationFrontend {
    const all: (pool: Pool) => (userId: string) => TE.TaskEither<Exception.t, Integration.Internal.t[]>;
    const getById: (pool: Pool) => (id: string) => TE.TaskEither<Exception.t, Integration.Internal.t>;
    const getByIdAndUserId: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Exception.t, Integration.Internal.t>;
    const create: (pool: Pool) => (integration: Integration.Frontend.Create.t) => TE.TaskEither<Exception.t, Integration.Internal.t>;
    const deleteById: (pool: Pool) => (userId: string) => (id: string) => TE.TaskEither<Exception.t, void>;
}
export default IntegrationFrontend;
