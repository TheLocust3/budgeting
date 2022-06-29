export type InvalidRule = { name: "InvalidRule" } & Error
export const throwInvalidRule: t = { name: "InvalidRule", message: "InvalidRule" };

export type BadRequest = { name: "BadRequest", message: string } & Error
export const throwBadRequest = (message: string): t => ({ name: "BadRequest", message: message });

export type MalformedJson = { name: "MalformedJson" } & Error
export const throwMalformedJson: t = { name: "MalformedJson", message: "MalformedJson" };

export type NotFound = { name: "NotFound" } & Error
export const throwNotFound: t = { name: "NotFound", message: "NotFound" };

export type InternalError = { name: "InternalError", message: string } & Error
export const throwInternalError = (error: any): t => ({ name: "InternalError", message: JSON.stringify(error, null, 2) });

export type Unauthorized = { name: "Unauthorized" } & Error
export const throwUnauthorized: t = { name: "Unauthorized", message: "Unauthorized" };

export type ValidationError = { name: "ValidationError", message: string } & Error
export const throwValidationError = (message: string): t => ({ name: "ValidationError", message: message });

export type NotUnique = { name: "NotUnique" } & Error
export const throwNotUnique: t = { name: "NotUnique", message: "NotUnique" };

export type t = Error & (InvalidRule | BadRequest | MalformedJson | NotFound | InternalError | Unauthorized | ValidationError | NotUnique)

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

export const format = (error: any): string => {
  switch (error.name) {
    case "InvalidRule":
      return "InvalidRule";
    case "BadRequest":
      return `BadRequest: ${error.message}`;
    case "MalformedJson":
      return "MalformedJson";
    case "NotFound":
      return "NotFound";
    case "InternalError":
      return `InternalError: ${error.message}`;
    case "Unauthorized":
      return "Unauthorized";
    case "ValidationError":
      return `ValidationError: ${error.message}`;
    case "NotUnique":
      return "NotUnique";
    default:
      return JSON.stringify(error, null, 2);
  }
}
