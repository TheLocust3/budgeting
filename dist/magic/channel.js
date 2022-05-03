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
exports.to = exports.toVoid = exports.pushWithToken = exports.push = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const Exception = __importStar(require("./exception"));
const Message = __importStar(require("./message"));
const push = (host) => (port) => (uri) => (method) => (body = O.none) => {
    return (0, exports.pushWithToken)(host)(port)(uri)(method)("")(body);
};
exports.push = push;
const pushWithToken = (host) => (port) => (uri) => (method) => (token) => (body = O.none) => {
    const resolved = O.match(() => { return {}; }, (body) => { return { body: JSON.stringify(body) }; })(body);
    return (0, pipeable_1.pipe)(TE.tryCatch(() => (0, node_fetch_1.default)(`http://${host}:${port}${uri}`, { method: method, ...resolved, headers: { "Content-Type": "application/json", "Authorization": token } }), E.toError), TE.chain((response) => {
        return TE.tryCatch(() => response.json(), E.toError);
    }), TE.mapLeft((_) => Exception.throwInternalError), TE.chain((response) => (0, pipeable_1.pipe)(response, Message.liftError, TE.fromEither)));
};
exports.pushWithToken = pushWithToken;
const toVoid = (task) => TE.map((_) => { return; })(task);
exports.toVoid = toVoid;
const to = (from) => (task) => {
    return TE.chain((response) => (0, pipeable_1.pipe)(response, from, TE.fromEither))(task);
};
exports.to = to;
//# sourceMappingURL=channel.js.map