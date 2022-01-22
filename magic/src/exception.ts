export type InvalidRule = { _type: "InvalidRule" }
export const throwInvalidRule: t = { _type: "InvalidRule" };

export type BadRequest = { _type: "BadRequest" }
export const throwBadRequest: t = { _type: "BadRequest" };

export type MalformedJson = { _type: "MalformedJson" }
export const throwMalformedJson: t = { _type: "MalformedJson" };

export type NotFound = { _type: "NotFound" }
export const throwNotFound: t = { _type: "NotFound" };

export type InternalError = { _type: "InternalError" }
export const throwInternalError: t = { _type: "InternalError" };

export type Unauthorized = { _type: "Unauthorized" }
export const throwUnauthorized: t = { _type: "Unauthorized" };

export type t = InvalidRule | BadRequest | MalformedJson | NotFound | InternalError | Unauthorized
