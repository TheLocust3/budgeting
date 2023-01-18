import { Logger } from "pino";

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

export const pgRaise = (log: Logger) => (error: any): t => {
  log.error(JSON.stringify(error, null, 2))
  switch (error.code) {
    case "23505":
      return throwNotUnique;
    default:
      return throwInternalError(error);
  }
}

export const raise = (log: Logger) => (error: any): t => {
  log.error(JSON.stringify(error, null, 2))
  return throwInternalError(error);
}

export const format = (error: any) => {
  switch (error.name) {
    case "InvalidRule":
    case "BadRequest":
    case "MalformedJson":
    case "NotFound":
    case "InternalError":
    case "Unauthorized":
    case "ValidationError":
    case "NotUnique":
      return { message: error.name, extensions: { ...error } };
    default:
      return { message: "InternalError", extensions: { ...throwInternalError(error) } };
  }
}
