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
exports.AccountChannel = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const engine_channel_1 = __importDefault(require("./engine-channel"));
const model_1 = require("../../model");
const magic_1 = require("../../magic");
var AccountChannel;
(function (AccountChannel) {
    AccountChannel.all = (userId) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/accounts?userId=${userId}`)('GET')(), magic_1.Channel.to(model_1.Account.Channel.Response.AccountList.Json.from), TE.map(({ accounts }) => accounts));
    };
    AccountChannel.getById = (userId) => (id) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/accounts/${id}?userId=${userId}`)('GET')(), magic_1.Channel.to(model_1.Account.Internal.Json.from));
    };
    // TODO: JK create any given rules
    AccountChannel.create = (account) => {
        return (0, pipeable_1.pipe)({ parentId: account.parentId, userId: account.userId, name: account.name }, model_1.Account.Frontend.Create.Json.to, O.some, engine_channel_1.default.push(`/accounts/`)('POST'), magic_1.Channel.to(model_1.Account.Internal.Json.from));
    };
    AccountChannel.deleteById = (userId) => (id) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/accounts/${id}?userId=${userId}`)('DELETE')(), magic_1.Channel.toVoid);
    };
    AccountChannel.materialize = (userId) => (id) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/accounts/${id}/materialize?userId=${userId}`)('GET')(), magic_1.Channel.to(model_1.Materialize.Internal.Json.from));
    };
})(AccountChannel = exports.AccountChannel || (exports.AccountChannel = {}));
exports.default = AccountChannel;
//# sourceMappingURL=account-channel.js.map