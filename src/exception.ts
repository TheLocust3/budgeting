export type InvalidRule = { _type: "InvalidRule" }
export const throwInvalidRule: Exception = { _type: "InvalidRule" }

export type BadRequest = { _type: "BadRequest" }
export const throwBadRequest: Exception = { _type: "BadRequest" }

export type MalformedJson = { _type: "MalformedJson" }
export const throwMalformedJson: Exception = { _type: "MalformedJson" }

export type NotFound = { _type: "NotFound" }
export const throwNotFound: Exception = { _type: "NotFound" }

export type InternalError = { _type: "InternalError" }
export const throwInternalError: Exception = { _type: "InternalError" }

export type Exception = InvalidRule | BadRequest | MalformedJson | NotFound | InternalError
