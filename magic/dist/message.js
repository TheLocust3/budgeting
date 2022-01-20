"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondWithError = exports.error = exports.ok = void 0;
exports.ok = { message: 'ok' };
const error = (details) => {
    return { message: 'failed', error: details };
};
exports.error = error;
const respondWithError = (ctx) => (exception) => {
    switch (exception._type) {
        case "InvalidRule":
            ctx.status = 400;
            ctx.body = (0, exports.error)("Invalid rule");
        case "BadRequest":
            ctx.status = 400;
            ctx.body = (0, exports.error)("Bad request");
        case "MalformedJson":
            ctx.status = 400;
            ctx.body = (0, exports.error)("Malformed Json");
        case "NotFound":
            ctx.status = 404;
            ctx.body = (0, exports.error)("Not found");
        case "InternalError":
            ctx.status = 500;
            ctx.body = (0, exports.error)("Internal error");
    }
};
exports.respondWithError = respondWithError;
//# sourceMappingURL=message.js.map