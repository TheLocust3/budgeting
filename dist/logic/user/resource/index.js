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
exports.createIntegration = exports.removeIntegration = exports.removeRule = exports.splitTransaction = exports.createBucket = exports.createUser = void 0;
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const util_1 = require("../util");
const index_1 = require("../index");
const account_channel_1 = __importDefault(require("../../channel/account-channel"));
const rule_channel_1 = __importDefault(require("../../channel/rule-channel"));
const storage_1 = require("../../../storage");
const createUser = (pool) => (user) => {
    return (0, pipeable_1.pipe)(TE.Do, TE.bind("user", () => storage_1.UserFrontend.create(pool)(user)), TE.bind("globalAccount", ({ user }) => account_channel_1.default.create({ parentId: O.none, userId: user.id, name: util_1.GLOBAL_ACCOUNT })), TE.bind("globalRule", ({ user, globalAccount }) => {
        return rule_channel_1.default.create({
            accountId: globalAccount.id,
            userId: user.id,
            rule: { _type: "Include", where: { _type: "StringMatch", field: "userId", operator: "Eq", value: user.id } }
        });
    }), TE.bind("physicalAccount", ({ user, globalAccount }) => account_channel_1.default.create({ parentId: O.some(globalAccount.id), userId: user.id, name: util_1.PHYSICAL_ACCOUNT })), TE.bind("virtualAccount", ({ user, globalAccount }) => account_channel_1.default.create({ parentId: O.some(globalAccount.id), userId: user.id, name: util_1.VIRTUAL_ACCOUNT })), TE.map(({ user }) => user));
};
exports.createUser = createUser;
const createAccount = (arena) => (source) => {
    const createSingleAccount = () => {
        return (0, pipeable_1.pipe)(index_1.UserArena.physical(arena), TE.map((physical) => ({ userId: arena.user.id, parentId: O.some(physical.account.id), name: source.name })), TE.chain(account_channel_1.default.create));
    };
    return (0, pipeable_1.pipe)(TE.Do, TE.bind("account", () => createSingleAccount()), TE.bind("rule", ({ account }) => createRule(arena)("physical")({
        _type: "SplitByPercent",
        where: { _type: "StringMatch", field: "sourceId", operator: "Eq", value: source.id },
        splits: [{ _type: "Percent", account: account.id, percent: 1 }]
    })), TE.map(({ account }) => account));
};
const createBucket = (arena) => (name) => {
    return (0, pipeable_1.pipe)(index_1.UserArena.virtual(arena), TE.map((virtual) => ({ userId: arena.user.id, parentId: O.some(virtual.account.id), name: name })), TE.chain(account_channel_1.default.create));
};
exports.createBucket = createBucket;
const resolveUserAccount = (arena) => (key) => {
    switch (key) {
        case "physical":
            return index_1.UserArena.physical(arena);
        case "virtual":
            return index_1.UserArena.virtual(arena);
    }
};
const createRule = (arena) => (key) => (rule) => {
    return (0, pipeable_1.pipe)(resolveUserAccount(arena)(key), TE.chain((account) => {
        return rule_channel_1.default.create({
            accountId: account.account.id,
            userId: arena.user.id,
            rule: rule
        });
    }));
};
const splitTransaction = (arena) => (transactionId, splits, remainder) => {
    return (0, pipeable_1.pipe)(index_1.UserArena.virtual(arena), TE.chain((virtual) => createRule(arena)("virtual")({
        _type: "SplitByValue",
        where: { _type: "StringMatch", field: "id", operator: "Eq", value: transactionId },
        splits: A.map(({ bucket, value }) => ({ _type: "Value", account: bucket, value: value }))(splits),
        remainder: remainder
    })));
};
exports.splitTransaction = splitTransaction;
const removeRule = (arena) => (ruleId) => {
    return (0, pipeable_1.pipe)(index_1.UserArena.virtual(arena), TE.chain((virtual) => rule_channel_1.default.deleteById(arena.user.id)(virtual.account.id)(ruleId)), TE.map(() => { }));
};
exports.removeRule = removeRule;
const removeIntegration = (pool) => (arena) => (integrationId) => {
    return (0, pipeable_1.pipe)(storage_1.IntegrationFrontend.deleteById(pool)(arena.user.id)(integrationId), TE.map(() => { }));
};
exports.removeIntegration = removeIntegration;
const createIntegration = (pool) => (requestId) => (arena) => (request) => (publicToken) => {
    const user = arena.user;
    console.log(`[${requestId}] - building integration/sources`);
    const buildIntegration = () => {
        console.log(`[${requestId}] - building integration "${request.institutionName}"`);
        const integration = {
            userId: user.id,
            name: request.institutionName,
            credentials: { _type: "Plaid", itemId: publicToken.item_id, accessToken: publicToken.access_token }
        };
        return storage_1.IntegrationFrontend.create(pool)(integration);
    };
    const buildSources = (integration) => {
        console.log(`[${requestId}] - building sources "${request.accounts}"`);
        const sources = A.map(({ id, name }) => {
            return {
                userId: user.id,
                name: name,
                integrationId: O.some(integration.id),
                tag: id
            };
        })(request.accounts);
        return (0, pipeable_1.pipe)(sources, A.map(storage_1.SourceFrontend.create(pool)), A.sequence(TE.ApplicativeSeq));
    };
    const buildAccounts = (sources) => {
        return (0, pipeable_1.pipe)(sources, A.map(createAccount(arena)), A.sequence(TE.ApplicativeSeq));
    };
    return (0, pipeable_1.pipe)(buildIntegration(), TE.chain(buildSources), TE.chain(buildAccounts), TE.map(() => {
        console.log(`[${requestId}] - integration/sources built`);
    }));
};
exports.createIntegration = createIntegration;
//# sourceMappingURL=index.js.map