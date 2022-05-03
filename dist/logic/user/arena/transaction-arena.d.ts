import * as TE from "fp-ts/TaskEither";
import * as Arena from "./index";
import { Materialize } from "../../../model";
import { Exception } from "../../../magic";
export declare type t = Materialize.Internal.t;
export declare const resolve: (accountId: string) => (arena: Arena.t) => TE.TaskEither<Exception.t, Materialize.Internal.t>;
