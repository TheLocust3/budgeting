"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolve = void 0;
const account_channel_1 = __importDefault(require("../../channel/account-channel"));
const resolve = (accountId) => (arena) => {
    return account_channel_1.default.materialize(arena.user.id)(accountId);
};
exports.resolve = resolve;
//# sourceMappingURL=transaction-arena.js.map