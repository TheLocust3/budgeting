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
exports.Integrations = exports.Transaction = exports.Rule = exports.Account = exports.fromId = exports.empty = exports.integrations = exports.materializeVirtual = exports.virtualRules = exports.virtual = exports.materializePhysical = exports.physical = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const util_1 = require("../util");
const AccountArena = __importStar(require("./account-arena"));
const RuleArena = __importStar(require("./rule-arena"));
const TransactionArena = __importStar(require("./transaction-arena"));
const IntegrationArena = __importStar(require("./integration-arena"));
const storage_1 = require("../../../storage");
const magic_1 = require("../../../magic");
const resolve = (arena) => (get) => (set) => (resolver) => {
    return O.match(() => {
        const out = magic_1.Pipe.toPromise(resolver(arena));
        set(O.some(out))(arena);
        return magic_1.Pipe.fromPromise(out); // a silly jig to make sure this task only evaluates _once_
    }, (value) => TE.tryCatch(() => value, () => magic_1.Exception.throwInternalError))(get(arena));
};
const physical = (arena) => {
    const get = (arena) => { return arena.physical.account; };
    const set = (value) => (arena) => { arena.physical.account = value; };
    return resolve(arena)(get)(set)(AccountArena.resolve(util_1.PHYSICAL_ACCOUNT));
};
exports.physical = physical;
const materializePhysical = (arena) => {
    const get = (arena) => { return arena.physical.transactions; };
    const set = (value) => (arena) => { arena.physical.transactions = value; };
    return (0, pipeable_1.pipe)((0, exports.physical)(arena), TE.chain((physical) => resolve(arena)(get)(set)(TransactionArena.resolve(physical.account.id))));
};
exports.materializePhysical = materializePhysical;
const virtual = (arena) => {
    const get = (arena) => { return arena.virtual.account; };
    const set = (value) => (arena) => { arena.virtual.account = value; };
    return resolve(arena)(get)(set)(AccountArena.resolve(util_1.VIRTUAL_ACCOUNT));
};
exports.virtual = virtual;
const virtualRules = (arena) => {
    const get = (arena) => { return arena.virtual.rules; };
    const set = (value) => (arena) => { arena.virtual.rules = value; };
    return (0, pipeable_1.pipe)((0, exports.virtual)(arena), TE.chain((virtual) => resolve(arena)(get)(set)(RuleArena.resolve(virtual.account.id))));
};
exports.virtualRules = virtualRules;
const materializeVirtual = (arena) => {
    const get = (arena) => { return arena.virtual.transactions; };
    const set = (value) => (arena) => { arena.virtual.transactions = value; };
    return (0, pipeable_1.pipe)((0, exports.virtual)(arena), TE.chain((virtual) => resolve(arena)(get)(set)(TransactionArena.resolve(virtual.account.id))));
};
exports.materializeVirtual = materializeVirtual;
const integrations = (pool) => (arena) => {
    const get = (arena) => { return arena.integrations; };
    const set = (value) => (arena) => { arena.integrations = value; };
    return resolve(arena)(get)(set)(IntegrationArena.resolve(pool));
};
exports.integrations = integrations;
const empty = (user) => {
    return {
        user: user,
        physical: { account: O.none, rules: O.none, transactions: O.none },
        virtual: { account: O.none, rules: O.none, transactions: O.none },
        integrations: O.none
    };
};
exports.empty = empty;
const fromId = (pool) => (userId) => {
    return (0, pipeable_1.pipe)(storage_1.UserFrontend.getById(pool)(userId), TE.map(exports.empty));
};
exports.fromId = fromId;
exports.Account = __importStar(require("./account-arena"));
exports.Rule = __importStar(require("./rule-arena"));
exports.Transaction = __importStar(require("./transaction-arena"));
exports.Integrations = __importStar(require("./integration-arena"));
//# sourceMappingURL=index.js.map