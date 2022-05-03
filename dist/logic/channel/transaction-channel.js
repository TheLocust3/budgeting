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
exports.TransactionChannel = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const engine_channel_1 = __importDefault(require("../channel/engine-channel"));
const model_1 = require("../../model");
const magic_1 = require("../../magic");
var TransactionChannel;
(function (TransactionChannel) {
    TransactionChannel.all = (userId) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/transactions?userId=${userId}`)('GET')(), magic_1.Channel.to(model_1.Transaction.Channel.Response.TransactionList.Json.from), TE.map(({ transactions }) => transactions));
    };
    TransactionChannel.getById = (userId) => (id) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/transactions/${id}?userId=${userId}`)('GET')(), magic_1.Channel.to(model_1.Transaction.Internal.Json.from));
    };
    TransactionChannel.create = (transaction) => {
        return (0, pipeable_1.pipe)({ ...transaction, authorizedAt: transaction.authorizedAt.getTime(), capturedAt: O.map((capturedAt) => capturedAt.getTime())(transaction.capturedAt) }, model_1.Transaction.Channel.Request.Create.Json.to, O.some, engine_channel_1.default.push(`/transactions/`)('POST'), magic_1.Channel.to(model_1.Transaction.Internal.Json.from));
    };
    TransactionChannel.deleteById = (userId) => (id) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/transactions/${id}?userId=${userId}`)('DELETE')(), magic_1.Channel.toVoid);
    };
})(TransactionChannel = exports.TransactionChannel || (exports.TransactionChannel = {}));
exports.default = TransactionChannel;
//# sourceMappingURL=transaction-channel.js.map