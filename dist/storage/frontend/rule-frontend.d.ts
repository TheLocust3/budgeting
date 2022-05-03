import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { Rule } from "../../model";
import { Exception } from "../../magic";
export declare namespace RuleFrontend {
    const getByAccountId: (pool: Pool) => (userId: string) => (accountId: string) => TE.TaskEither<Exception.t, Rule.Internal.t[]>;
    const getById: (pool: Pool) => (userId: string) => (accountId: string) => (id: string) => TE.TaskEither<Exception.t, Rule.Internal.t>;
    const create: (pool: Pool) => (rule: Rule.Frontend.Create.t) => TE.TaskEither<Exception.t, Rule.Internal.t>;
    const deleteById: (pool: Pool) => (userId: string) => (accountId: string) => (id: string) => TE.TaskEither<Exception.t, void>;
}
export default RuleFrontend;
