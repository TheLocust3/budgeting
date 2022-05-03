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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondWithOk = exports.respondWith = exports.parseQuery = exports.parseBody = exports.fromQuery = exports.Router = void 0;
const express_1 = __importDefault(require("express"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/TaskEither"));
const iot = __importStar(require("io-ts"));
const Exception = __importStar(require("./exception"));
const Message = __importStar(require("./message"));
// provide some basic Koa interop to make my life easier
class Router {
    constructor() {
        this.router = express_1.default.Router();
        this.use = (handler) => {
            this.router.use(handler);
        };
        this.get = (route, handler) => {
            this.router.get(route, this.handleRoute(handler));
        };
        this.post = (route, handler) => {
            this.router.post(route, this.handleRoute(handler));
        };
        this.delete = (route, handler) => {
            this.router.delete(route, this.handleRoute(handler));
        };
        this.handleRoute = (handler) => {
            return async (request, response) => {
                await handler({ request, response });
            };
        };
    }
}
exports.Router = Router;
const fromQuery = (value) => {
    return (0, pipeable_1.pipe)(value, iot.string.decode, E.mapLeft((_) => Exception.throwBadRequest));
};
exports.fromQuery = fromQuery;
const parseBody = (context) => (formatter) => {
    return (0, pipeable_1.pipe)(formatter.from(context.request.body), TE.fromEither);
};
exports.parseBody = parseBody;
const parseQuery = (context) => (formatter) => {
    return (0, pipeable_1.pipe)(context.request.query, formatter.from, TE.fromEither);
};
exports.parseQuery = parseQuery;
const respondWith = (context) => (formatter) => (response) => {
    return (0, pipeable_1.pipe)(response, TE.map((response) => formatter.to(response)), TE.match(Message.respondWithError(context), (out) => {
        context.response.json(out);
    }))();
};
exports.respondWith = respondWith;
const respondWithOk = (context) => (response) => {
    return (0, pipeable_1.pipe)(response, TE.match(Message.respondWithError(context), (out) => {
        context.response.json(Message.ok);
    }))();
};
exports.respondWithOk = respondWithOk;
//# sourceMappingURL=route.js.map