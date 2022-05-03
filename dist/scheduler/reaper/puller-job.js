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
exports.run = void 0;
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const util_1 = require("./util");
const magic_1 = require("../../magic");
const storage_1 = require("../../storage");
// given a source:
//   1) pull + "lock" a source
//   2) pull the credentials for the source
//   3) send all transactions after `source.createdAt` to the rules engine
const pull = (pool) => {
    return (0, pipeable_1.pipe)(storage_1.SourceFrontend.pull(pool)(), TE.mapLeft((error) => {
        switch (error._type) {
            case "NotFound":
                return "NoWork";
            default:
                console.log(error);
                return "Exception";
        }
    }));
};
const pullTransactions = (plaidClient) => (id) => (context) => {
    console.log(`Scheduler.puller[${id}] - pulling transactions`);
    const accountId = context.source.tag;
    const createdAt = context.source.createdAt;
    return (0, pipeable_1.pipe)(magic_1.Plaid.getTransactions(plaidClient)(context.integration.credentials.accessToken, createdAt, new Date()), TE.mapLeft((error) => {
        console.log(error);
        return "Exception";
    }), TE.map(A.filter((transaction) => transaction.account_id === accountId)), TE.map(A.map((transaction) => {
        const authorizedAt = (0, pipeable_1.pipe)(O.fromNullable(transaction.authorized_datetime), magic_1.Pipe.orElse(() => O.fromNullable(transaction.datetime)), O.fold(() => new Date(), (date) => new Date(date)));
        const capturedAt = O.fromNullable(transaction.datetime);
        return {
            id: transaction.transaction_id,
            sourceId: context.source.id,
            userId: context.source.userId,
            amount: -1 * transaction.amount,
            merchantName: String(transaction.merchant_name),
            description: String(transaction.name),
            authorizedAt: authorizedAt,
            capturedAt: capturedAt,
            metadata: {}
        };
    })));
};
const run = (pool) => (plaidClient) => (id) => {
    return (0, pipeable_1.pipe)(pull(pool), TE.chain((0, util_1.withIntegration)(pool)), TE.map((context) => {
        console.log(`Scheduler.puller[${id}] - pulling for ${context.source.id}`);
        return context;
    }), TE.chain(pullTransactions(plaidClient)(id)), TE.chain((0, util_1.pushTransactions)(pool)(id)), TE.match((error) => {
        switch (error) {
            case "NoWork":
                return true;
            case "Exception":
                console.log(`Scheduler.puller[${id}] - failed - ${error}`);
                return true;
        }
    }, () => {
        console.log(`Scheduler.puller[${id}] - completed`);
        return true;
    }));
};
exports.run = run;
//# sourceMappingURL=puller-job.js.map