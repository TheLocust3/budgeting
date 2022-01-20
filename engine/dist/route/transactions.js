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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const router_1 = __importDefault(require("@koa/router"));
const A = __importStar(require("fp-ts/Array"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const transaction_frontend_1 = __importDefault(require("../frontend/transaction-frontend"));
const Transaction = __importStar(require("../model/transaction"));
const magic_1 = require("magic");
exports.router = new router_1.default();
exports.router
    .get('/', (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, pipeable_1.pipe)(transaction_frontend_1.default.all(ctx.db)(), TE.map(A.map(Transaction.Json.to)), TE.match(magic_1.Message.respondWithError(ctx), (transactions) => {
        ctx.body = { transactions: transactions };
    }))();
}))
    .get('/:transactionId', (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const transactionId = ctx.params.transactionId;
    yield (0, pipeable_1.pipe)(transactionId, transaction_frontend_1.default.getById(ctx.db), TE.map(Transaction.Json.to), TE.match(magic_1.Message.respondWithError(ctx), (transaction) => {
        ctx.body = { transaction: transaction };
    }))();
}))
    .post('/', (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, pipeable_1.pipe)(ctx.request.body, Transaction.Json.from, TE.fromEither, TE.chain(transaction_frontend_1.default.create(ctx.db)), TE.map(Transaction.Json.to), TE.match(magic_1.Message.respondWithError(ctx), (transaction) => {
        ctx.body = transaction;
    }))();
}))
    .delete('/:transactionId', (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    const transactionId = ctx.params.transactionId;
    yield (0, pipeable_1.pipe)(transactionId, transaction_frontend_1.default.deleteById(ctx.db), TE.match(magic_1.Message.respondWithError(ctx), (_) => {
        ctx.body = magic_1.Message.ok;
    }))();
}));
//# sourceMappingURL=transactions.js.map