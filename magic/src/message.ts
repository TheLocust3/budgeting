import * as E from "fp-ts/Either";
import * as Exception from "./exception";

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

export const respondWithError = (ctx: any) => (exception: Exception.t): void => {
  console.log(`[${ctx.state.id}] responding with ${exception._type}`)

  switch (exception._type) {
    case "InvalidRule":
      ctx.status = 400;
      ctx.body = error("Invalid rule");
      return;
    case "BadRequest":
      ctx.status = 400;
      ctx.body = error("Bad request");
      return;
    case "MalformedJson":
      ctx.status = 400;
      ctx.body = error("Malformed Json");
      return;
    case "NotFound":
      ctx.status = 404;
      ctx.body = error("Not found");
      return;
    case "InternalError":
      ctx.status = 500;
      ctx.body = error("Internal error");
      return;
    case "Unauthorized":
      ctx.status = 403;
      ctx.body = error("Unauthorized");
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
        return E.left(Exception.throwBadRequest);
      case "Malformed Json":
        return E.left(Exception.throwMalformedJson);
      case "Not found":
        return E.left(Exception.throwNotFound);
      case "Internal error":
        return E.left(Exception.throwInternalError);
      case "Unauthorized":
        return E.left(Exception.throwUnauthorized);
      default:
        return E.left(Exception.throwInternalError);
    }
  } else {
    return E.right(response);
  }
}
