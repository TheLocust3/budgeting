import Express from "express";
import * as E from "fp-ts/Either";

import * as Exception from "./exception";
import * as Route from "./route";

type OkMessage = {
  message: "ok";
}

type ErrorMessage = {
  message: "failed";
  error: string;
}

export type t = OkMessage | ErrorMessage;

export const ok = { message: "ok" };
export const error = (details: string): ErrorMessage => {
  return { message: "failed", error: details };
};

export const respondWithError = (context: Route.Context) => (exception: Exception.t): void => {
  console.log(`[${context.response.locals.id}] responding with ${exception._type}`)

  switch (exception._type) {
    case "InvalidRule":
      context.response.status(400).json(error("Invalid rule"));
      return;
    case "BadRequest":
      context.response.status(400).json(error("Bad request"));
      return;
    case "MalformedJson":
      context.response.status(400).json(error("Malformed Json"));
      return;
    case "NotFound":
      context.response.status(404).json(error("Not found"));
      return;
    case "InternalError":
      context.response.status(500).json(error("Internal error"));
      return;
    case "Unauthorized":
      context.response.status(403).json(error("Unauthorized"));
      return;
  }
};

// JK: not the greatest way of doing this
export const liftError = (response: any): E.Either<Exception.t, any> => {
  if ("message" in response && response.message === "failed") {
    switch (response.error) {
      case "Invalid rule":
        return E.left(Exception.throwInvalidRule);
      case "Bad request":
        return E.left(Exception.throwBadRequest(""));
      case "Malformed Json":
        return E.left(Exception.throwMalformedJson);
      case "Not found":
        return E.left(Exception.throwNotFound);
      case "Internal error":
        return E.left(Exception.throwInternalError("null"));
      case "Unauthorized":
        return E.left(Exception.throwUnauthorized);
      default:
        return E.left(Exception.throwInternalError("null"));
    }
  } else {
    return E.right(response);
  }
}
