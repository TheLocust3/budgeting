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
exports.router = void 0;
const crypto_1 = __importDefault(require("crypto"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const model_1 = require("../../model");
const storage_1 = require("../../storage");
const magic_1 = require("../../magic");
exports.router = new magic_1.Route.Router();
exports.router
    .get("/", (context) => {
    return (0, pipeable_1.pipe)(magic_1.Route.parseQuery(context)(model_1.Transaction.Channel.Query.Json), TE.chain(({ userId }) => storage_1.TransactionFrontend.all(context.request.app.locals.db)(userId)), TE.map((transactions) => { return { transactions: transactions }; }), magic_1.Route.respondWith(context)(model_1.Transaction.Channel.Response.TransactionList.Json));
});
exports.router
    .get("/:transactionId", (context) => {
    const transactionId = context.request.params.transactionId;
    return (0, pipeable_1.pipe)(magic_1.Route.parseQuery(context)(model_1.Transaction.Channel.Query.Json), TE.chain(({ userId }) => storage_1.TransactionFrontend.getById(context.request.app.locals.db)(userId)(transactionId)), magic_1.Route.respondWith(context)(model_1.Transaction.Internal.Json));
});
exports.router
    .post("/", (context) => {
    return (0, pipeable_1.pipe)(magic_1.Route.parseBody(context)(model_1.Transaction.Channel.Request.Create.Json), TE.map((createTransaction) => {
        const capturedAt = O.map((capturedAt) => new Date(capturedAt))(createTransaction.capturedAt);
        return { ...createTransaction, id: crypto_1.default.randomUUID(), authorizedAt: new Date(createTransaction.authorizedAt), capturedAt: capturedAt };
    }), TE.chain(storage_1.TransactionFrontend.create(context.request.app.locals.db)), magic_1.Route.respondWith(context)(model_1.Transaction.Internal.Json));
});
exports.router
    .delete("/:transactionId", (context) => {
    const transactionId = context.request.params.transactionId;
    return (0, pipeable_1.pipe)(magic_1.Route.parseQuery(context)(model_1.Transaction.Channel.Query.Json), TE.chain(({ userId }) => storage_1.TransactionFrontend.deleteById(context.request.app.locals.db)(userId)(transactionId)), magic_1.Route.respondWithOk(context));
});
//# sourceMappingURL=transactions.js.map