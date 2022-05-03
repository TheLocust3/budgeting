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
exports.create = exports.deleteById = exports.childrenOf = exports.byId = exports.all = exports.rollback = exports.migrate = void 0;
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
    CREATE TABLE accounts (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id TEXT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY(parent_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `;
    Query.dropTable = "DROP TABLE accounts";
    Query.create = (parentId, userId, name) => {
        return {
            text: `
        INSERT INTO accounts (parent_id, user_id, name)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
            values: [parentId, userId, name]
        };
    };
    Query.all = (userId) => {
        return {
            text: `
        SELECT id, parent_id, user_id, name
        FROM accounts
        WHERE user_id = $1
      `,
            values: [userId]
        };
    };
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, parent_id, user_id, name
        FROM accounts
        WHERE id = $1
        LIMIT 1
      `,
            values: [id]
        };
    };
    Query.childrenOf = (parent) => {
        return {
            text: `
        SELECT id
        FROM accounts
        WHERE parent_id = $1
      `,
            values: [parent]
        };
    };
    Query.deleteById = (id, userId) => {
        return {
            text: `
        DELETE FROM accounts
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
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.all(userId)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Account.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))));
};
exports.all = all;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Account.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const childrenOf = (pool) => (parent) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.childrenOf(parent)), E.toError), TE.map(res => (0, function_1.pipe)(res.rows, A.map(row => String(row.id)))));
};
exports.childrenOf = childrenOf;
const deleteById = (pool) => (userId) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(id, userId)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (account) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create((0, function_1.pipe)(account.parentId, O.match(() => null, (parentId) => parentId)), account.userId, account.name)), E.toError), magic_1.Db.expectOne, TE.chain(res => (0, function_1.pipe)(res.rows[0], model_1.Account.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither)));
};
exports.create = create;
//# sourceMappingURL=accounts-table.js.map