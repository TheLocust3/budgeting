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
exports.run = void 0;
const crypto_1 = __importDefault(require("crypto"));
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const util_1 = require("./util");
const magic_1 = require("../../magic");
const storage_1 = require("../../storage");
const pull = (pool) => {
    return (0, pipeable_1.pipe)(storage_1.SourceFrontend.pullForRollup(pool)(), TE.mapLeft((error) => {
        switch (error._type) {
            case "NotFound":
                return "NoWork";
            default:
                console.log(error);
                return "Exception";
        }
    }));
};
const rollup = (plaidClient) => (id) => (context) => {
    console.log(`Scheduler.rollup[${id}] - pulling account balances`);
    const accountId = context.source.tag;
    const createdAt = context.source.createdAt;
    return (0, pipeable_1.pipe)(magic_1.Plaid.getAccounts(plaidClient)(context.integration.credentials.accessToken, createdAt, new Date()), TE.mapLeft((error) => {
        console.log(error);
        return "Exception";
    }), TE.map(A.filter((account) => account.account_id === accountId)), TE.chain((accounts) => {
        if (accounts.length !== 1) {
            console.log(`Scheduler.rollup[${id}] - wrong number of matching accounts ${accounts}`);
            return TE.throwError("Exception");
        }
        else {
            return TE.of(accounts[0]);
        }
    }), TE.map((account) => {
        return [{
                id: crypto_1.default.randomUUID(),
                sourceId: context.source.id,
                userId: context.source.userId,
                amount: account.balances.current,
                merchantName: "",
                description: "Starting balance",
                authorizedAt: context.source.createdAt,
                capturedAt: O.some(context.source.createdAt),
                metadata: {}
            }];
    }));
};
const run = (pool) => (plaidClient) => (id) => {
    return (0, pipeable_1.pipe)(pull(pool), TE.chain((0, util_1.withIntegration)(pool)), TE.map((context) => {
        console.log(`Scheduler.rollup[${id}] - pulling for ${context.source.id}`);
        return context;
    }), TE.chain(rollup(plaidClient)(id)), TE.chain((0, util_1.pushTransactions)(pool)(id)), TE.match((error) => {
        switch (error) {
            case "NoWork":
                return true;
            case "Exception":
                console.log(`Scheduler.rollup[${id}] - failed - ${error}`);
                return true;
        }
    }, () => {
        console.log(`Scheduler.rollup[${id}] - completed`);
        return true;
    }));
};
exports.run = run;
//# sourceMappingURL=rollup-job.js.map