import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import { Rule } from "../../model";
import { Exception } from "../../magic";
declare namespace Validate {
    const rule: (pool: Pool) => (body: Rule.Frontend.Create.t) => TE.TaskEither<Exception.t, Rule.Frontend.Create.t>;
}
export default Validate;
