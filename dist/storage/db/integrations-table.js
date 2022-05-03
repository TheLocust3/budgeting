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
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const model_1 = require("../../model");
const magic_1 = require("../../magic");
var Query;
(function (Query) {
    Query.createTable = `
    CREATE TABLE integrations (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      credentials JSONB NOT NULL
    )
  `;
    Query.dropTable = "DROP TABLE integrations";
    Query.create = (userId, name, credentials) => {
        return {
            text: `
        INSERT INTO integrations (user_id, name, credentials)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
            values: [userId, name, credentials]
        };
    };
    Query.all = (userId) => {
        return {
            text: `
        SELECT id, user_id, name, credentials
        FROM integrations
        WHERE user_id = $1
      `,
            values: [userId]
        };
    };
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, user_id, name, credentials
        FROM integrations
        WHERE id = $1
        LIMIT 1
      `,
            values: [id]
        };
    };
    Query.deleteById = (userId, id) => {
        return {
            text: `
        DELETE FROM integrations
        WHERE user_id = $1 AND id = $2
      `,
            values: [userId, id]
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
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.all(userId)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Integration.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))));
};
exports.all = all;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Integration.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const deleteById = (pool) => (userId) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(userId, id)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (integration) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create(integration.userId, integration.name, integration.credentials)), E.toError), magic_1.Db.expectOne, TE.chain(res => (0, function_1.pipe)(res.rows[0], model_1.Integration.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither)));
};
exports.create = create;
//# sourceMappingURL=integrations-table.js.map