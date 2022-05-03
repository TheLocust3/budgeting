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
exports.pullForRollup = exports.pull = exports.create = exports.deleteById = exports.byIntegrationId = exports.byId = exports.all = exports.rollback = exports.migrate = void 0;
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
    CREATE TABLE sources (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      name TEXT NOT NULL,
      integration_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      last_refreshed TIMESTAMP,
      FOREIGN KEY(integration_id) REFERENCES integrations(id) ON DELETE CASCADE,
      CONSTRAINT uq UNIQUE(user_id, tag)
    )
  `;
    Query.dropTable = "DROP TABLE sources";
    Query.create = (userId, name, integrationId, tag) => {
        return {
            text: `
        INSERT INTO sources (user_id, name, integration_id, tag)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
            values: [userId, name, integrationId, tag]
        };
    };
    Query.all = (userId) => {
        return {
            text: `
        SELECT id, user_id, name, integration_id, tag, created_at
        FROM sources
        WHERE user_id = $1
      `,
            values: [userId]
        };
    };
    Query.byId = (userId, id) => {
        return {
            text: `
        SELECT id, user_id, name, integration_id, tag, created_at
        FROM sources
        WHERE user_id = $1 AND id = $2
        LIMIT 1
      `,
            values: [userId, id]
        };
    };
    Query.byIntegrationId = (userId, integrationId) => {
        return {
            text: `
        SELECT id, user_id, name, integration_id, tag, created_at
        FROM sources
        WHERE user_id = $1 AND integration_id = $2
      `,
            values: [userId, integrationId]
        };
    };
    Query.deleteById = (userId, id) => {
        return {
            text: `
        DELETE FROM sources
        WHERE user_id = $1 AND id = $2
      `,
            values: [userId, id]
        };
    };
    Query.pullForRollup = `
    UPDATE sources
    SET last_refreshed = to_timestamp(0)
    WHERE id IN (
      SELECT id
      FROM sources
      WHERE last_refreshed IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    )
    RETURNING id, user_id, name, integration_id, tag, created_at
  `;
    const isExpired = `last_refreshed IS NOT NULL AND last_refreshed < now() - '10 minutes' :: interval AND integration_id IS NOT NULL`;
    Query.pull = `
    UPDATE sources
    SET last_refreshed = now()
    WHERE id IN (
      SELECT id
      FROM sources
      WHERE ${isExpired}
      ORDER BY last_refreshed DESC
      LIMIT 1
    )
    RETURNING id, user_id, name, integration_id, tag, created_at
  `;
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
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.all(userId)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Source.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))));
};
exports.all = all;
const byId = (pool) => (userId) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(userId, id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Source.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const byIntegrationId = (pool) => (userId) => (integrationId) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byIntegrationId(userId, integrationId)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Source.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))));
};
exports.byIntegrationId = byIntegrationId;
const deleteById = (pool) => (userId) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(userId, id)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (source) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create(source.userId, source.name, O.match(() => null, (id) => id)(source.integrationId), source.tag)), E.toError), magic_1.Db.expectOne, TE.chain(res => (0, function_1.pipe)(res.rows[0], model_1.Source.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither)));
};
exports.create = create;
const pull = (pool) => () => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.pull), (e) => {
        console.log(e);
        throw e;
    }), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Source.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.pull = pull;
const pullForRollup = (pool) => () => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.pullForRollup), (e) => {
        console.log(e);
        throw e;
    }), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.Source.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.pullForRollup = pullForRollup;
//# sourceMappingURL=sources-table.js.map