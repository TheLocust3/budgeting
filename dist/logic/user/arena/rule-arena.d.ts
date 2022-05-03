import * as TE from "fp-ts/TaskEither";
import * as Arena from "./index";
import { Rule } from "../../../model";
import { Exception } from "../../../magic";
export declare type t = Rule.Internal.t[];
export declare const resolve: (accountId: string) => (arena: Arena.t) => TE.TaskEither<Exception.t, Rule.Internal.t[]>;
