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
exports.create = exports.deleteById = exports.byId = exports.byAccountId = exports.rollback = exports.migrate = void 0;
const function_1 = require("fp-ts/lib/function");
const A = __importStar(require("fp-ts/Array"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const model_1 = require("../../model");
const magic_1 = require("../../magic");
var Query;
(function (Query) {
    Query.createTable = `
    CREATE TABLE rules (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rule JSONB NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `;
    Query.dropTable = "DROP TABLE rules";
    Query.create = (accountId, userId, rule) => {
        return {
            text: `
        INSERT INTO rules (account_id, user_id, rule)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
            values: [accountId, userId, rule]
        };
    };
    Query.byAccountId = (accountId, userId) => {
        return {
            text: `
        SELECT id, account_id, user_id, rule
        FROM rules
        WHERE account_id = $1 and user_id = $2
      `,
            values: [accountId, userId]
        };
    };
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, account_id, user_id, rule
        FROM rules
        WHERE id = $1
        LIMIT 1
      `,
            values: [id]
        };
    };
    Query.deleteById = (id, accountId, userId) => {
        return {
            text: `
        DELETE FROM rules
        WHERE id = $1 AND account_id = $2 AND user_id = $3
      `,
            values: [id, accountId, userId]
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
const byAccountId = (pool) => (userId) => (accountId) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byAccountId(accountId, userId)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Rule.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))));
};
exports.byAccountId = byAccountId;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Rule.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const deleteById = (pool) => (userId) => (accountId) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(id, accountId, userId)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (rule) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create(rule.accountId, rule.userId, rule.rule)), (error) => {
        console.log(error);
        return E.toError(error);
    }), magic_1.Db.expectOne, TE.chain(res => (0, function_1.pipe)(res.rows[0], model_1.Rule.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither)));
};
exports.create = create;
//# sourceMappingURL=rules-table.js.map