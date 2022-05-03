export declare type InvalidRule = {
    _type: "InvalidRule";
};
export declare const throwInvalidRule: t;
export declare type BadRequest = {
    _type: "BadRequest";
};
export declare const throwBadRequest: t;
export declare type MalformedJson = {
    _type: "MalformedJson";
};
export declare const throwMalformedJson: t;
export declare type NotFound = {
    _type: "NotFound";
};
export declare const throwNotFound: t;
export declare type InternalError = {
    _type: "InternalError";
};
export declare const throwInternalError: t;
export declare type Unauthorized = {
    _type: "Unauthorized";
};
export declare const throwUnauthorized: t;
export declare type t = InvalidRule | BadRequest | MalformedJson | NotFound | InternalError | Unauthorized;
