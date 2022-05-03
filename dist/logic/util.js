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
exports.JWT = exports.AuthenticationFor = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const iot = __importStar(require("io-ts"));
const storage_1 = require("../storage");
const magic_1 = require("../magic");
var AuthenticationFor;
(function (AuthenticationFor) {
    const tryHeader = (request) => {
        return JWT.verify(request.app.locals.db)(String(request.header("Authorization")));
    };
    const tryCookie = (request) => {
        return JWT.verify(request.app.locals.db)(String(request.cookies["auth-token"]));
    };
    AuthenticationFor.user = async (request, response, next) => {
        await (0, pipeable_1.pipe)(tryHeader(request), TE.orElse(() => tryCookie(request)), TE.match(magic_1.Message.respondWithError({ request, response }), async (user) => {
            response.locals.user = user;
            next();
        }))();
    };
    AuthenticationFor.admin = async (request, response, next) => {
        await (0, pipeable_1.pipe)(tryHeader(request), TE.orElse(() => tryCookie(request)), TE.chain((user) => {
            if (user.role === 'superuser') {
                return TE.of(user);
            }
            else {
                return TE.throwError(magic_1.Exception.throwUnauthorized);
            }
        }), TE.match(magic_1.Message.respondWithError({ request, response }), async (user) => {
            response.locals.user = user;
            next();
        }))();
    };
})(AuthenticationFor = exports.AuthenticationFor || (exports.AuthenticationFor = {}));
var JWT;
(function (JWT) {
    let Payload;
    (function (Payload) {
        Payload.t = iot.type({
            userId: iot.string
        });
        Payload.from = (request) => {
            return (0, pipeable_1.pipe)(request, Payload.t.decode, E.mapLeft((_) => magic_1.Exception.throwMalformedJson));
        };
    })(Payload || (Payload = {}));
    JWT.sign = (user) => {
        const payload = { userId: user.id };
        return jsonwebtoken_1.default.sign(payload, "secret"); // TODO: JK
    };
    JWT.verify = (pool) => (token) => {
        if (token !== undefined && token !== null && token !== "") {
            return (0, pipeable_1.pipe)(E.tryCatch(() => jsonwebtoken_1.default.verify(token, "secret") // TODO JK
            , () => magic_1.Exception.throwUnauthorized), E.chain(Payload.from), TE.fromEither, TE.chain(({ userId }) => storage_1.UserFrontend.getById(pool)(userId)), TE.mapLeft((_) => magic_1.Exception.throwUnauthorized));
        }
        else {
            return TE.throwError(magic_1.Exception.throwUnauthorized);
        }
    };
})(JWT = exports.JWT || (exports.JWT = {}));
//# sourceMappingURL=util.js.map