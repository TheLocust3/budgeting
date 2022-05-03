import Express from "express";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import * as Exception from "./exception";
import * as Format from "./format";
export declare type Context = {
    request: Express.Request;
    response: Express.Response;
};
declare type Handler = (context: Context) => Promise<void>;
export declare class Router {
    router: import("express-serve-static-core").Router;
    use: (handler: Express.RequestHandler) => void;
    get: (route: string, handler: Handler) => void;
    post: (route: string, handler: Handler) => void;
    delete: (route: string, handler: Handler) => void;
    private handleRoute;
}
export declare const fromQuery: (value: string | string[] | undefined) => E.Either<Exception.t, string>;
export declare const parseBody: (context: Context) => <T>(formatter: Format.Formatter<T>) => TE.TaskEither<Exception.t, T>;
export declare const parseQuery: (context: Context) => <T>(formatter: Format.Formatter<T>) => TE.TaskEither<Exception.t, T>;
export declare const respondWith: (context: Context) => <T>(formatter: Format.Formatter<T>) => (response: TE.TaskEither<Exception.t, T>) => Promise<void>;
export declare const respondWithOk: (context: Context) => (response: TE.TaskEither<Exception.t, any>) => Promise<void>;
export {};
