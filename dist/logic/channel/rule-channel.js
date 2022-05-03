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
exports.RuleChannel = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const engine_channel_1 = __importDefault(require("./engine-channel"));
const model_1 = require("../../model");
const magic_1 = require("../../magic");
var RuleChannel;
(function (RuleChannel) {
    RuleChannel.all = (userId) => (accountId) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/rules?accountId=${accountId}&userId=${userId}`)('GET')(), magic_1.Channel.to(model_1.Rule.Channel.Response.RuleList.Json.from), TE.map(({ rules }) => rules));
    };
    RuleChannel.getById = (userId) => (accountId) => (id) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/rules/${id}?accountId=${accountId}&userId=${userId}`)('GET')(), magic_1.Channel.to(model_1.Rule.Internal.Json.from));
    };
    RuleChannel.create = (rule) => {
        return (0, pipeable_1.pipe)(rule, model_1.Rule.Frontend.Create.Json.to, O.some, engine_channel_1.default.push(`/rules/`)('POST'), magic_1.Channel.to(model_1.Rule.Internal.Json.from));
    };
    RuleChannel.deleteById = (userId) => (accountId) => (id) => {
        return (0, pipeable_1.pipe)(engine_channel_1.default.push(`/rules/${id}?accountId=${accountId}&userId=${userId}`)('DELETE')(), magic_1.Channel.toVoid);
    };
})(RuleChannel = exports.RuleChannel || (exports.RuleChannel = {}));
exports.default = RuleChannel;
//# sourceMappingURL=rule-channel.js.map