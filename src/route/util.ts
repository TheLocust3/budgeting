import { Exception } from '../exception'

export namespace Message {
  type OkMessage = {
    message: 'ok';
  }

  type ErrorMessage = {
    message: 'failed';
    error: string;
  }

  export type t = OkMessage | ErrorMessage;

  export const ok = { message: 'ok' };
  export const error = (details: string): ErrorMessage => {
    return { message: 'failed', error: details };
  }

  export const respondWithError = (ctx: any) => (exception: Exception): void => {
    switch (exception._type) {
      case "InvalidRule":
        ctx.status = 400;
        ctx.body = error("Invalid rule");
      case "BadRequest":
        ctx.status = 400;
        ctx.body = error("Bad request");
      case "MalformedJson":
        ctx.status = 400;
        ctx.body = error("Malformed Json");
      case "NotFound":
        ctx.status = 404;
        ctx.body = error("Not found");
      case "InternalError":
        ctx.status = 500;
        ctx.body = error("Internal error");
    }
  }
}
