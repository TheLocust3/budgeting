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
exports.resolve = void 0;
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const account_channel_1 = __importDefault(require("../../channel/account-channel"));
const magic_1 = require("../../../magic");
const build = (accounts) => (forAccount) => {
    const isParentOf = (account) => {
        return O.match(() => false, (parentId) => parentId === forAccount.id)(account.parentId);
    };
    return {
        account: forAccount,
        children: (0, pipeable_1.pipe)(accounts, A.filter((account) => isParentOf(account)), A.map(build(accounts)))
    };
};
const resolve = (name) => (arena) => {
    const forName = (name) => (accounts) => {
        const matching = A.filter((account) => account.name === name)(accounts);
        if (matching.length === 0) {
            return TE.throwError(magic_1.Exception.throwNotFound);
        }
        else {
            return TE.of(matching[0]);
        }
    };
    return (0, pipeable_1.pipe)(TE.Do, TE.bind("allAccounts", () => account_channel_1.default.all(arena.user.id)), TE.bind("account", ({ allAccounts }) => forName(name)(allAccounts)), TE.map(({ allAccounts, account }) => {
        return build(allAccounts)(account);
    }));
};
exports.resolve = resolve;
//# sourceMappingURL=account-arena.js.map