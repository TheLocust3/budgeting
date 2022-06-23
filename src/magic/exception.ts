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

export type ValidationError = { _type: "ValidationError", message: string }
export const throwValidationError = (message: string): t => ({ _type: "ValidationError", message: message });

export type t = InvalidRule | BadRequest | MalformedJson | NotFound | InternalError | Unauthorized | ValidationError

export const raise = (error: any): t => {
  console.log(JSON.stringify(error, null, 2))
  return { _type: "InternalError" };
}
