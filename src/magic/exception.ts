export type InvalidRule = { _type: "InvalidRule" }
export const throwInvalidRule: t = { _type: "InvalidRule" };

export type BadRequest = { _type: "BadRequest", message: string }
export const throwBadRequest = (message: string): t => ({ _type: "BadRequest", message: message });

export type MalformedJson = { _type: "MalformedJson" }
export const throwMalformedJson: t = { _type: "MalformedJson" };

export type NotFound = { _type: "NotFound" }
export const throwNotFound: t = { _type: "NotFound" };

export type InternalError = { _type: "InternalError", message: string }
export const throwInternalError = (error: any): t => ({ _type: "InternalError", message: `${error}` });

export type Unauthorized = { _type: "Unauthorized" }
export const throwUnauthorized: t = { _type: "Unauthorized" };

export type ValidationError = { _type: "ValidationError", message: string }
export const throwValidationError = (message: string): t => ({ _type: "ValidationError", message: message });

export type NotUnique = { _type: "NotUnique" }
export const throwNotUnique: t = { _type: "NotUnique" };

export type t = InvalidRule | BadRequest | MalformedJson | NotFound | InternalError | Unauthorized | ValidationError | NotUnique

export const pgRaise = (error: any): t => {
  console.log(JSON.stringify(error, null, 2))
  switch (error.code) {
    case "23505":
      return throwNotUnique;
    default:
      return throwInternalError(error);
  }
}

export const raise = (error: any): t => {
  console.log(JSON.stringify(error, null, 2))
  return throwInternalError(error);
}
