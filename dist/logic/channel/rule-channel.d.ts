import * as TE from "fp-ts/TaskEither";
import { Rule } from "../../model";
import { Exception } from "../../magic";
export declare namespace RuleChannel {
    const all: (userId: string) => (accountId: string) => TE.TaskEither<Exception.t, Rule.Internal.t[]>;
    const getById: (userId: string) => (accountId: string) => (id: string) => TE.TaskEither<Exception.t, Rule.Internal.t>;
    const create: (rule: Rule.Frontend.Create.t) => TE.TaskEither<Exception.t, Rule.Internal.t>;
    const deleteById: (userId: string) => (accountId: string) => (id: string) => TE.TaskEither<Exception.t, void>;
}
export default RuleChannel;
