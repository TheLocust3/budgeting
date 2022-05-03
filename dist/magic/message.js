"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liftError = exports.respondWithError = exports.error = exports.ok = void 0;
const E = __importStar(require("fp-ts/Either"));
const Exception = __importStar(require("./exception"));
exports.ok = { message: "ok" };
const error = (details) => {
    return { message: "failed", error: details };
};
exports.error = error;
const respondWithError = (context) => (exception) => {
    console.log(`[${context.response.locals.id}] responding with ${exception._type}`);
    switch (exception._type) {
        case "InvalidRule":
            context.response.status(400).json((0, exports.error)("Invalid rule"));
            return;
        case "BadRequest":
            context.response.status(400).json((0, exports.error)("Bad request"));
            return;
        case "MalformedJson":
            context.response.status(400).json((0, exports.error)("Malformed Json"));
            return;
        case "NotFound":
            context.response.status(404).json((0, exports.error)("Not found"));
            return;
        case "InternalError":
            context.response.status(500).json((0, exports.error)("Internal error"));
            return;
        case "Unauthorized":
            context.response.status(403).json((0, exports.error)("Unauthorized"));
            return;
    }
};
exports.respondWithError = respondWithError;
// JK: not the greatest way of doing this
const liftError = (response) => {
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
    }
    else {
        return E.right(response);
    }
};
exports.liftError = liftError;
//# sourceMappingURL=message.js.map