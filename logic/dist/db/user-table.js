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
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const User = __importStar(require("../model/User"));
const magic_1 = require("magic");
var Query;
(function (Query) {
    Query.createTable = `
    CREATE TABLE users (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      password TEXT NOT NULL
    )
  `;
    Query.dropTable = `DROP TABLE users`;
    Query.create = (email, password) => {
        return {
            text: `
        INSERT INTO users (email, password)
        VALUES ($1, $2)
        RETURNING *
      `,
            values: [email, password]
        };
    };
    Query.all = `
    SELECT id, email, password
    FROM users
  `;
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, email, password
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
            values: [id]
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
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.all), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(User.Database.from), A.sequence(E.Applicative)))));
};
exports.all = all;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(User.Database.from), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const deleteById = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(id)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (user) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create(user.email, user.password)), E.toError), magic_1.Db.expectOne, TE.chain(res => TE.fromEither(User.Database.from(res.rows[0]))));
};
exports.create = create;
//# sourceMappingURL=user-table.js.map