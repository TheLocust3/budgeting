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
exports.AccountFrontend = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const rule_frontend_1 = __importDefault(require("./rule-frontend"));
const AccountsTable = __importStar(require("../db/accounts"));
const magic_1 = require("magic");
var AccountFrontend;
(function (AccountFrontend) {
    AccountFrontend.all = (pool) => () => {
        return (0, pipeable_1.pipe)(AccountsTable.all(pool)(), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    AccountFrontend.getById = (pool) => (id) => {
        return (0, pipeable_1.pipe)(id, AccountsTable.byId(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (account) => TE.of(account))));
    };
    AccountFrontend.withRules = (pool) => (account) => {
        return (0, pipeable_1.pipe)(account.id, O.match(() => TE.throwError(magic_1.Exception.throwInternalError), (id) => TE.of(id)), TE.chain(rule_frontend_1.default.getByAccountId(pool)), TE.map((rules) => { return Object.assign(Object.assign({}, account), { rules: rules }); }));
    };
    AccountFrontend.withChildren = (pool) => (account) => {
        return (0, pipeable_1.pipe)(account.id, O.match(() => TE.throwError(magic_1.Exception.throwInternalError), (id) => TE.of(id)), TE.chain((id) => (0, pipeable_1.pipe)(id, AccountsTable.childrenOf(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError))), TE.map((children) => { return Object.assign(Object.assign({}, account), { children: children }); }));
    };
    AccountFrontend.create = (pool) => (account) => {
        return (0, pipeable_1.pipe)(account, AccountsTable.create(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    AccountFrontend.deleteById = (pool) => (id) => {
        return (0, pipeable_1.pipe)(id, AccountsTable.deleteById(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
})(AccountFrontend = exports.AccountFrontend || (exports.AccountFrontend = {}));
exports.default = AccountFrontend;
//# sourceMappingURL=account-frontend.js.map