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
const types = __importStar(require("io-ts-types"));
const camelcase_keys_1 = __importDefault(require("camelcase-keys"));
const magic_1 = require("magic");
var Json;
(function (Json) {
    Json.Request = iot.type({
        parentId: types.optionFromNullable(iot.string),
        name: iot.string
    });
    Json.from = (account) => {
        return (0, pipeable_1.pipe)(account, Json.Request.decode, E.map((account) => { return Object.assign(Object.assign({}, account), { id: O.none, rules: [], children: [] }); }), E.mapLeft((_) => magic_1.Exception.throwMalformedJson));
    };
    Json.to = (account) => {
        const id = (0, pipeable_1.pipe)(account.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }));
        return Object.assign(Object.assign({}, id), { name: account.name });
    };
})(Json = exports.Json || (exports.Json = {}));
var Database;
(function (Database) {
    Database.t = iot.type({
        id: iot.string,
        parent_id: types.optionFromNullable(iot.string),
        name: iot.string
    });
    Database.from = (account) => {
        return (0, pipeable_1.pipe)(account, Database.t.decode, E.map(camelcase_keys_1.default), E.map(account => { return Object.assign(Object.assign({}, account), { id: O.some(account.id), rules: [], children: [] }); }), E.mapLeft(E.toError));
    };
})(Database = exports.Database || (exports.Database = {}));
//# sourceMappingURL=account.js.map