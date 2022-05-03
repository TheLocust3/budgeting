import * as O from "fp-ts/Option";
import * as TE from "fp-ts/TaskEither";
import * as Exception from "./exception";
export declare const flattenOption: <T>(arr: O.Option<T>[]) => T[];
export declare const orElse: <T>(elseOpt: () => O.Option<T>) => (opt: O.Option<T>) => O.Option<T>;
export declare const toPromise: <T>(task: TE.TaskEither<Exception.t, T>) => Promise<T>;
export declare const fromPromise: <T>(promise: Promise<T>) => TE.TaskEither<Exception.t, T>;
