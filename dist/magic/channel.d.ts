import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as Exception from "./exception";
export declare const push: (host: string) => (port: string) => (uri: string) => (method: string) => (body?: O.Option<any>) => TE.TaskEither<Exception.t, any>;
export declare const pushWithToken: (host: string) => (port: string) => (uri: string) => (method: string) => (token: string) => (body?: O.Option<any>) => TE.TaskEither<Exception.t, any>;
export declare const toVoid: (task: TE.TaskEither<Exception.t, any>) => TE.TaskEither<Exception.t, void>;
export declare const to: <T>(from: (response: any) => E.Either<Exception.t, T>) => (task: TE.TaskEither<Exception.t, any>) => TE.TaskEither<Exception.t, T>;
