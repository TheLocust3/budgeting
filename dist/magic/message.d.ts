import * as E from "fp-ts/Either";
import * as Exception from "./exception";
import * as Route from "./route";
declare type OkMessage = {
    message: "ok";
};
declare type ErrorMessage = {
    message: "failed";
    error: string;
};
export declare type t = OkMessage | ErrorMessage;
export declare const ok: {
    message: string;
};
export declare const error: (details: string) => ErrorMessage;
export declare const respondWithError: (context: Route.Context) => (exception: Exception.t) => void;
export declare const liftError: (response: any) => E.Either<Exception.t, any>;
export {};
