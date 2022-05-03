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
exports.External = exports.Frontend = exports.Internal = exports.SUPERUSER_ROLE = exports.DEFAULT_ROLE = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const E = __importStar(require("fp-ts/Either"));
const iot = __importStar(require("io-ts"));
const magic_1 = require("../magic");
exports.DEFAULT_ROLE = "user";
exports.SUPERUSER_ROLE = "superuser";
var Internal;
(function (Internal) {
    Internal.t = iot.type({
        id: iot.string,
        email: iot.string,
        password: iot.string,
        role: iot.string
    });
    Internal.Json = new magic_1.Format.JsonFormatter(Internal.t);
    Internal.Database = new class {
        constructor() {
            this.TableType = iot.type({
                id: iot.string,
                email: iot.string,
                password: iot.string,
                role: iot.string
            });
            this.from = (obj) => {
                return (0, pipeable_1.pipe)(obj, this.TableType.decode, E.mapLeft((_) => magic_1.Exception.throwInternalError));
            };
            this.to = (obj) => {
                return this.TableType.encode(obj);
            };
        }
    };
})(Internal = exports.Internal || (exports.Internal = {}));
var Frontend;
(function (Frontend) {
    let Create;
    (function (Create) {
        const t = iot.type({
            email: iot.string,
            password: iot.string,
            role: iot.string
        });
        Create.Json = new magic_1.Format.JsonFormatter(t);
    })(Create = Frontend.Create || (Frontend.Create = {}));
})(Frontend = exports.Frontend || (exports.Frontend = {}));
var External;
(function (External) {
    let Request;
    (function (Request) {
        let Credentials;
        (function (Credentials) {
            const t = iot.type({
                email: iot.string,
                password: iot.string
            });
            Credentials.Json = new magic_1.Format.JsonFormatter(t);
        })(Credentials = Request.Credentials || (Request.Credentials = {}));
        let Create;
        (function (Create) {
            const t = iot.type({
                email: iot.string,
                password: iot.string
            });
            Create.Json = new magic_1.Format.JsonFormatter(t);
        })(Create = Request.Create || (Request.Create = {}));
    })(Request = External.Request || (External.Request = {}));
    let Response;
    (function (Response) {
        let Token;
        (function (Token) {
            const t = iot.type({
                token: iot.string
            });
            Token.Json = new magic_1.Format.JsonFormatter(t);
        })(Token = Response.Token || (Response.Token = {}));
        let UserList;
        (function (UserList) {
            const t = iot.type({
                users: iot.array(Internal.t)
            });
            UserList.Json = new magic_1.Format.JsonFormatter(t);
        })(UserList = Response.UserList || (Response.UserList = {}));
    })(Response = External.Response || (External.Response = {}));
})(External = exports.External || (exports.External = {}));
//# sourceMappingURL=user.js.map