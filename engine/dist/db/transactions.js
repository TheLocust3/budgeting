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
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.deleteById = exports.byId = exports.all = exports.rollback = exports.migrate = void 0;
const function_1 = require("fp-ts/lib/function");
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const Transaction = __importStar(require("../model/Transaction"));
const magic_1 = require("magic");
var Query;
(function (Query) {
    Query.createTable = `
    CREATE TABLE transactions (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      merchant_name TEXT NOT NULL,
      description TEXT NOT NULL,
      authorized_at TIMESTAMP NOT NULL,
      captured_at TIMESTAMP,
      metadata JSONB NOT NULL
    )
  `;
    Query.dropTable = `DROP TABLE transactions`;
    Query.create = (sourceId, amount, merchantName, description, authorizedAt, capturedAt, metadata) => {
        return {
            text: `
        INSERT INTO transactions (source_id, amount, merchant_name, description, authorized_at, captured_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
            values: [sourceId, amount, merchantName, description, authorizedAt, capturedAt, metadata]
        };
    };
    Query.all = `
    SELECT id, source_id, amount, merchant_name, description, authorized_at, captured_at, metadata
    FROM transactions
  `;
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, source_id, amount, merchant_name, description, authorized_at, captured_at, metadata
        FROM transactions
        WHERE id = $1
        LIMIT 1
      `,
            values: [id]
        };
    };
    Query.deleteById = (id) => {
        return {
            text: `
        DELETE FROM transactions
        WHERE id = $1
      `,
            values: [id]
        };
    };
})(Query || (Query = {}));
const migrate = (pool) => () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield pool.query(Query.createTable);
        return true;
    }
    catch (err) {
        console.log(err);
        return false;
    }
});
exports.migrate = migrate;
const rollback = (pool) => () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield pool.query(Query.dropTable);
        return true;
    }
    catch (err) {
        console.log(err);
        return false;
    }
});
exports.rollback = rollback;
const all = (pool) => () => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.all), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(Transaction.Database.from), A.sequence(E.Applicative)))));
};
exports.all = all;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(Transaction.Database.from), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const deleteById = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(id)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (transaction) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create(transaction.sourceId, transaction.amount, transaction.merchantName, transaction.description, transaction.authorizedAt, (0, function_1.pipe)(transaction.capturedAt, O.match(() => null, (date) => date)), transaction.metadata)), E.toError), magic_1.Db.expectOne, TE.chain(res => TE.fromEither(Transaction.Database.from(res.rows[0]))));
};
exports.create = create;
//# sourceMappingURL=transactions.js.map