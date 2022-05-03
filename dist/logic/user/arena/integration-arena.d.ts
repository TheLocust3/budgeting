import { Pool } from "pg";
import * as TE from "fp-ts/TaskEither";
import * as Arena from "./index";
import { Integration, Source } from "../../../model";
import { Exception } from "../../../magic";
declare type WithSources = {
    integration: Integration.Internal.t;
    sources: Source.Internal.t[];
};
export declare type t = WithSources[];
export declare const resolve: (pool: Pool) => (arena: Arena.t) => TE.TaskEither<Exception.t, t>;
export {};
