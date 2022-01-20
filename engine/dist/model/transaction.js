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
exports.Database = exports.Json = exports.Materialize = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const iot = __importStar(require("io-ts"));
const types = __importStar(require("io-ts-types"));
const camelcase_keys_1 = __importDefault(require("camelcase-keys"));
const magic_1 = require("magic");
var Materialize;
(function (Materialize) {
    Materialize.from = (transaction) => {
        const id = (0, pipeable_1.pipe)(transaction.id, O.getOrElse(() => ""));
        return {
            id: id,
            sourceId: transaction.sourceId,
            amount: transaction.amount,
            merchantName: transaction.merchantName,
            description: transaction.description,
            authorizedAt: transaction.authorizedAt.getTime(),
            capturedAt: O.map((capturedAt) => capturedAt.getTime())(transaction.capturedAt),
            metadata: transaction.metadata,
            custom: {}
        };
    };
    Materialize.to = (transaction) => {
        return {
            id: O.some(transaction.id),
            sourceId: transaction.sourceId,
            amount: transaction.amount,
            merchantName: transaction.merchantName,
            description: transaction.description,
            authorizedAt: new Date(transaction.authorizedAt),
            capturedAt: O.map((capturedAt) => new Date(capturedAt))(transaction.capturedAt),
            metadata: transaction.metadata,
            custom: transaction.custom
        };
    };
})(Materialize = exports.Materialize || (exports.Materialize = {}));
var Json;
(function (Json) {
    Json.Request = iot.type({
        sourceId: iot.string,
        amount: iot.number,
        merchantName: iot.string,
        description: iot.string,
        authorizedAt: iot.number,
        capturedAt: types.optionFromNullable(iot.number),
        metadata: iot.object
    });
    let Field;
    (function (Field) {
        Field.NumberField = iot.union([
            iot.literal("amount"),
            iot.literal("authorizedAt"),
            iot.literal("capturedAt")
        ]);
        Field.OptionNumberField = iot.literal("capturedAt");
        Field.StringField = iot.union([
            iot.literal("id"),
            iot.literal("sourceId"),
            iot.literal("merchantName"),
            iot.literal("description")
        ]);
        Field.t = iot.union([
            Field.NumberField,
            Field.StringField
        ]);
    })(Field = Json.Field || (Json.Field = {}));
    Json.from = (transaction) => {
        return (0, pipeable_1.pipe)(transaction, Json.Request.decode, E.map(transaction => {
            const capturedAt = O.map((capturedAt) => new Date(capturedAt))(transaction.capturedAt);
            return Object.assign(Object.assign({}, transaction), { id: O.none, authorizedAt: new Date(transaction.authorizedAt), capturedAt: capturedAt, custom: {} });
        }), E.mapLeft((_) => magic_1.Exception.throwMalformedJson));
    };
    Json.to = (transaction) => {
        const id = (0, pipeable_1.pipe)(transaction.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }));
        const capturedAt = (0, pipeable_1.pipe)(transaction.capturedAt, O.map(capturedAt => { return { capturedAt: capturedAt.getTime() }; }), O.getOrElse(() => { return {}; }));
        return Object.assign(Object.assign(Object.assign(Object.assign({}, id), { sourceId: transaction.sourceId, amount: transaction.amount, merchantName: transaction.merchantName, description: transaction.description, authorizedAt: transaction.authorizedAt.getTime() }), capturedAt), { metadata: transaction.metadata, custom: transaction.custom });
    };
})(Json = exports.Json || (exports.Json = {}));
var Database;
(function (Database) {
    Database.t = iot.type({
        id: iot.string,
        source_id: iot.string,
        amount: types.NumberFromString,
        merchant_name: iot.string,
        description: iot.string,
        authorized_at: types.date,
        captured_at: types.optionFromNullable(types.date),
        metadata: iot.object
    });
    Database.from = (transaction) => {
        return (0, pipeable_1.pipe)(transaction, Database.t.decode, E.map(camelcase_keys_1.default), E.map(transaction => { return Object.assign(Object.assign({}, transaction), { id: O.some(transaction.id), custom: {} }); }), E.mapLeft(E.toError));
    };
})(Database = exports.Database || (exports.Database = {}));
//# sourceMappingURL=transaction.js.map