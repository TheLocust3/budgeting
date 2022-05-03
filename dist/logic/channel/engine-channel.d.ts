import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import { Exception } from "../../magic";
export declare namespace EngineChannel {
    const push: (uri: string) => (method: string) => (body?: O.Option<any>) => TE.TaskEither<Exception.t, any>;
}
export default EngineChannel;
