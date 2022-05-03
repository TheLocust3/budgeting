import * as TE from "fp-ts/TaskEither";
import * as Arena from "./index";
import { Account } from "../../../model";
import { Exception } from "../../../magic";
export declare type t = {
    account: Account.Internal.t;
    children: t[];
};
export declare const resolve: (name: string) => (arena: Arena.t) => TE.TaskEither<Exception.t, t>;
