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
exports.pushTransactions = exports.withIntegration = void 0;
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const storage_1 = require("../../storage");
const withIntegration = (pool) => (source) => {
    // at this point, an integration id must exist
    const integrationId = O.match(() => "", (integrationId) => integrationId)(source.integrationId);
    return (0, pipeable_1.pipe)(integrationId, storage_1.IntegrationFrontend.getById(pool), TE.mapLeft((error) => {
        console.log(error);
        return "Exception";
    }), TE.map((integration) => ({ source: source, integration: integration })));
};
exports.withIntegration = withIntegration;
const pushTransactions = (pool) => (id) => (transactions) => {
    console.log(`Scheduler.puller[${id}] - pushing ${transactions.length} transactions`);
    const push = (transaction) => {
        return (0, pipeable_1.pipe)(transaction, storage_1.TransactionFrontend.create(pool), TE.mapLeft((error) => {
            console.log(error);
            return "Exception";
        }), TE.map((_) => { return; }));
    };
    return (0, pipeable_1.pipe)(transactions, A.map(push), A.sequence(TE.ApplicativeSeq), TE.map((_) => { return; }));
};
exports.pushTransactions = pushTransactions;
//# sourceMappingURL=util.js.map