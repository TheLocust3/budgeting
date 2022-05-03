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
exports.create = exports.deleteById = exports.byId = exports.all = exports.rollback = exports.migrate = void 0;
const function_1 = require("fp-ts/lib/function");
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const model_1 = require("../../model");
const magic_1 = require("../../magic");
var Query;
(function (Query) {
    Query.createTable = `
    CREATE TABLE transactions (
      id TEXT NOT NULL UNIQUE PRIMARY KEY,
      source_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      merchant_name TEXT NOT NULL,
      description TEXT NOT NULL,
      authorized_at TIMESTAMP NOT NULL,
      captured_at TIMESTAMP,
      metadata JSONB NOT NULL
    )
  `;
    Query.dropTable = "DROP TABLE transactions";
    Query.create = (id, sourceId, userId, amount, merchantName, description, authorizedAt, capturedAt, metadata) => {
        return {
            text: `
        INSERT INTO transactions (id, source_id, user_id, amount, merchant_name, description, authorized_at, captured_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id)
        DO UPDATE SET amount=excluded.amount, merchant_name=excluded.merchant_name, description=excluded.description, captured_at=excluded.captured_at, metadata=excluded.metadata
        RETURNING *
      `,
            values: [id, sourceId, userId, amount, merchantName, description, authorizedAt, capturedAt, metadata]
        };
    };
    Query.all = (userId) => {
        return {
            text: `
        SELECT id, source_id, user_id, amount, merchant_name, description, authorized_at, captured_at, metadata
        FROM transactions
        WHERE user_id = $1
      `,
            values: [userId]
        };
    };
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, source_id, user_id, amount, merchant_name, description, authorized_at, captured_at, metadata
        FROM transactions
        WHERE id = $1
        LIMIT 1
      `,
            values: [id]
        };
    };
    Query.deleteById = (id, userId) => {
        return {
            text: `
        DELETE FROM transactions
        WHERE id = $1 AND user_id = $2
      `,
            values: [id, userId]
        };
    };
})(Query || (Query = {}));
const migrate = (pool) => async () => {
    try {
        await pool.query(Query.createTable);
        return true;
    }
    catch (err) {
        console.log(err);
        return false;
    }
};
exports.migrate = migrate;
const rollback = (pool) => async () => {
    try {
        await pool.query(Query.dropTable);
        return true;
    }
    catch (err) {
        console.log(err);
        return false;
    }
};
exports.rollback = rollback;
const all = (pool) => (userId) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.all(userId)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Transaction.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))));
};
exports.all = all;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Transaction.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const deleteById = (pool) => (userId) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(id, userId)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (transaction) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create(transaction.id, transaction.sourceId, transaction.userId, transaction.amount, transaction.merchantName, transaction.description, transaction.authorizedAt, (0, function_1.pipe)(transaction.capturedAt, O.match(() => null, (date) => date)), transaction.metadata)), (e) => {
        console.log(e);
        return E.toError(e);
    }), magic_1.Db.expectOne, TE.chain(res => (0, function_1.pipe)(res.rows[0], model_1.Transaction.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither)));
};
exports.create = create;
//# sourceMappingURL=transactions-table.js.map