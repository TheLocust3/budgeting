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
exports.Channel = exports.Frontend = exports.Internal = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const E = __importStar(require("fp-ts/Either"));
const iot = __importStar(require("io-ts"));
const types = __importStar(require("io-ts-types"));
const magic_1 = require("../magic");
var Internal;
(function (Internal) {
    Internal.t = iot.type({
        id: iot.string,
        sourceId: iot.string,
        userId: iot.string,
        amount: iot.number,
        merchantName: iot.string,
        description: iot.string,
        authorizedAt: types.DateFromISOString,
        capturedAt: types.option(types.DateFromISOString),
        metadata: iot.object,
        custom: iot.record(iot.string, iot.array(iot.string))
    });
    Internal.Json = new magic_1.Format.JsonFormatter(Internal.t);
    Internal.Database = new class {
        constructor() {
            this.TableType = iot.type({
                id: iot.string,
                source_id: iot.string,
                user_id: iot.string,
                amount: types.NumberFromString,
                merchant_name: iot.string,
                description: iot.string,
                authorized_at: types.date,
                captured_at: types.optionFromNullable(types.date),
                metadata: iot.object
            });
            this.from = (obj) => {
                return (0, pipeable_1.pipe)(obj, this.TableType.decode, E.mapLeft((_) => magic_1.Exception.throwInternalError), E.map(({ id, source_id, user_id, amount, merchant_name, description, authorized_at, captured_at, metadata }) => {
                    return {
                        id: id,
                        sourceId: source_id,
                        userId: user_id,
                        amount: amount,
                        merchantName: merchant_name,
                        description: description,
                        authorizedAt: authorized_at,
                        capturedAt: captured_at,
                        metadata: metadata,
                        custom: {}
                    };
                }));
            };
            this.to = (obj) => {
                return {}; // TODO: JK we don't use this anywhere but should probably implement it
            };
        }
    };
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
            iot.literal("userId"),
            iot.literal("merchantName"),
            iot.literal("description")
        ]);
        Field.t = iot.union([
            Field.NumberField,
            Field.StringField
        ]);
    })(Field = Internal.Field || (Internal.Field = {}));
})(Internal = exports.Internal || (exports.Internal = {}));
var Frontend;
(function (Frontend) {
    let Create;
    (function (Create) {
        const t = iot.type({
            id: iot.string,
            sourceId: iot.string,
            userId: iot.string,
            amount: iot.number,
            merchantName: iot.string,
            description: iot.string,
            authorizedAt: types.date,
            capturedAt: types.option(types.date),
            metadata: iot.object
        });
        Create.Json = new magic_1.Format.JsonFormatter(t);
    })(Create = Frontend.Create || (Frontend.Create = {}));
})(Frontend = exports.Frontend || (exports.Frontend = {}));
var Channel;
(function (Channel) {
    let Query;
    (function (Query) {
        const t = iot.type({
            userId: iot.string
        });
        Query.Json = new magic_1.Format.JsonFormatter(t);
    })(Query = Channel.Query || (Channel.Query = {}));
    let Request;
    (function (Request) {
        let Create;
        (function (Create) {
            const t = iot.type({
                sourceId: iot.string,
                userId: iot.string,
                amount: iot.number,
                merchantName: iot.string,
                description: iot.string,
                authorizedAt: iot.number,
                capturedAt: types.option(iot.number),
                metadata: iot.object
            });
            Create.Json = new magic_1.Format.JsonFormatter(t);
        })(Create = Request.Create || (Request.Create = {}));
    })(Request = Channel.Request || (Channel.Request = {}));
    let Response;
    (function (Response) {
        let TransactionList;
        (function (TransactionList) {
            const t = iot.type({
                transactions: iot.array(Internal.t)
            });
            TransactionList.Json = new magic_1.Format.JsonFormatter(t);
        })(TransactionList = Response.TransactionList || (Response.TransactionList = {}));
    })(Response = Channel.Response || (Channel.Response = {}));
})(Channel = exports.Channel || (exports.Channel = {}));
//# sourceMappingURL=transaction.js.map