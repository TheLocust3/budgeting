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
exports.RuleFrontend = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const RulesTable = __importStar(require("../db/rules-table"));
const magic_1 = require("../../magic");
var RuleFrontend;
(function (RuleFrontend) {
    RuleFrontend.getByAccountId = (pool) => (userId) => (accountId) => {
        return (0, pipeable_1.pipe)(RulesTable.byAccountId(pool)(userId)(accountId), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    RuleFrontend.getById = (pool) => (userId) => (accountId) => (id) => {
        return (0, pipeable_1.pipe)(id, RulesTable.byId(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (rule) => TE.of(rule))), TE.chain((rule) => {
            if (rule.accountId == accountId && rule.userId == userId) {
                return TE.of(rule);
            }
            else {
                return TE.throwError(magic_1.Exception.throwNotFound);
            }
        }));
    };
    RuleFrontend.create = (pool) => (rule) => {
        return (0, pipeable_1.pipe)(rule, RulesTable.create(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    RuleFrontend.deleteById = (pool) => (userId) => (accountId) => (id) => {
        return (0, pipeable_1.pipe)(id, RulesTable.deleteById(pool)(userId)(accountId), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
})(RuleFrontend = exports.RuleFrontend || (exports.RuleFrontend = {}));
exports.default = RuleFrontend;
//# sourceMappingURL=rule-frontend.js.map