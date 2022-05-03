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
exports.setRole = exports.create = exports.deleteById = exports.byEmail = exports.byId = exports.all = exports.rollback = exports.migrate = void 0;
const function_1 = require("fp-ts/lib/function");
const A = __importStar(require("fp-ts/Array"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const model_1 = require("../../model");
const magic_1 = require("../../magic");
var Query;
(function (Query) {
    Query.createTable = `
    CREATE TABLE users (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `;
    Query.dropTable = "DROP TABLE users";
    Query.create = (email, password, role) => {
        return {
            text: `
        INSERT INTO users (email, password, role)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
            values: [email, password, role]
        };
    };
    Query.all = `
    SELECT id, email, password, role
    FROM users
  `;
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, email, password, role
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
            values: [id]
        };
    };
    Query.byEmail = (email) => {
        return {
            text: `
        SELECT id, email, password, role
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
            values: [email]
        };
    };
    Query.deleteById = (id) => {
        return {
            text: `
        DELETE FROM users
        WHERE id = $1
      `,
            values: [id]
        };
    };
    Query.setRole = (id, role) => {
        return {
            text: `
        UPDATE users
        SET role = $2
        WHERE id = $1
        RETURNING id, email, password, role
      `,
            values: [id, role]
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
const all = (pool) => () => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.all), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.User.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))));
};
exports.all = all;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.User.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const byEmail = (pool) => (email) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byEmail(email)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(model_1.User.Internal.Database.from), A.map(E.mapLeft(E.toError)), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byEmail = byEmail;
const deleteById = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(id)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (user) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create(user.email, user.password, user.role)), E.toError), magic_1.Db.expectOne, TE.chain(res => (0, function_1.pipe)(res.rows[0], model_1.User.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither)));
};
exports.create = create;
const setRole = (pool) => (role) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.setRole(id, role)), E.toError), magic_1.Db.expectOne, TE.chain(res => (0, function_1.pipe)(res.rows[0], model_1.User.Internal.Database.from, E.mapLeft(E.toError), TE.fromEither)));
};
exports.setRole = setRole;
//# sourceMappingURL=users-table.js.map