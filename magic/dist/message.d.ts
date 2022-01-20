import * as Exception from './exception';
declare type OkMessage = {
    message: 'ok';
};
declare type ErrorMessage = {
    message: 'failed';
    error: string;
};
export declare type t = OkMessage | ErrorMessage;
export declare const ok: {
    message: string;
};
export declare const error: (details: string) => ErrorMessage;
export declare const respondWithError: (ctx: any) => (exception: Exception.t) => void;
export {};
