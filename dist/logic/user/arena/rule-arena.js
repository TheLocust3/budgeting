"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = void 0;
const rule_channel_1 = __importDefault(require("../../channel/rule-channel"));
const resolve = (accountId) => (arena) => {
    return rule_channel_1.default.all(arena.user.id)(accountId);
};
exports.resolve = resolve;
//# sourceMappingURL=rule-arena.js.map