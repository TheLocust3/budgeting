"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.Database = exports.Json = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const iot = __importStar(require("io-ts"));
const camelcase_keys_1 = __importDefault(require("camelcase-keys"));
const magic_1 = require("magic");
var Json;
(function (Json) {
    Json.Request = iot.type({
        email: iot.string,
        password: iot.string
    });
    Json.from = (user) => {
        return (0, pipeable_1.pipe)(user, Json.Request.decode, E.map((user) => { return Object.assign(Object.assign({}, user), { id: O.none }); }), E.mapLeft((_) => magic_1.Exception.throwMalformedJson));
    };
    Json.to = (user) => {
        const id = (0, pipeable_1.pipe)(user.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }));
        return Object.assign(Object.assign({}, id), { email: user.email, password: user.password });
    };
})(Json = exports.Json || (exports.Json = {}));
var Database;
(function (Database) {
    Database.t = iot.type({
        id: iot.string,
        email: iot.string,
        password: iot.string
    });
    Database.from = (user) => {
        return (0, pipeable_1.pipe)(user, Database.t.decode, E.map(camelcase_keys_1.default), E.map(user => { return Object.assign(Object.assign({}, user), { id: O.some(user.id) }); }), E.mapLeft(E.toError));
    };
})(Database = exports.Database || (exports.Database = {}));
//# sourceMappingURL=User.js.map