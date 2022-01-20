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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionFrontend = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const TransactionsTable = __importStar(require("../db/transactions"));
const magic_1 = require("magic");
var TransactionFrontend;
(function (TransactionFrontend) {
    TransactionFrontend.all = (pool) => () => {
        return (0, pipeable_1.pipe)(TransactionsTable.all(pool)(), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    TransactionFrontend.getById = (pool) => (id) => {
        return (0, pipeable_1.pipe)(id, TransactionsTable.byId(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (rule) => TE.of(rule))));
    };
    TransactionFrontend.create = (pool) => (transaction) => {
        return (0, pipeable_1.pipe)(transaction, TransactionsTable.create(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    TransactionFrontend.deleteById = (pool) => (id) => {
        return (0, pipeable_1.pipe)(id, TransactionsTable.deleteById(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
})(TransactionFrontend = exports.TransactionFrontend || (exports.TransactionFrontend = {}));
exports.default = TransactionFrontend;
//# sourceMappingURL=transaction-frontend.js.map