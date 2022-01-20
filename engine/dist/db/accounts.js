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
exports.create = exports.deleteById = exports.childrenOf = exports.byId = exports.all = exports.rollback = exports.migrate = void 0;
const function_1 = require("fp-ts/lib/function");
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const Account = __importStar(require("../model/Account"));
const magic_1 = require("magic");
var Query;
(function (Query) {
    Query.createTable = `
    CREATE TABLE accounts (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id TEXT,
      name TEXT NOT NULL,
      FOREIGN KEY(parent_id) REFERENCES accounts(id)
    )
  `;
    Query.dropTable = `DROP TABLE accounts`;
    Query.create = (parentId, name) => {
        return {
            text: `
        INSERT INTO accounts (parent_id, name)
        VALUES ($1, $2)
        RETURNING *
      `,
            values: [parentId, name]
        };
    };
    Query.all = `
    SELECT id, parent_id, name
    FROM accounts
  `;
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, parent_id, name
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
    Query.deleteById = (id) => {
        return {
            text: `
        DELETE FROM accounts
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
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.all), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(Account.Database.from), A.sequence(E.Applicative)))));
};
exports.all = all;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(Account.Database.from), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const childrenOf = (pool) => (parent) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.childrenOf(parent)), E.toError), TE.map(res => (0, function_1.pipe)(res.rows, A.map(row => String(row.id)))));
};
exports.childrenOf = childrenOf;
const deleteById = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(id)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (account) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create((0, function_1.pipe)(account.parentId, O.match(() => null, (parentId) => parentId)), account.name)), E.toError), magic_1.Db.expectOne, TE.chain(res => TE.fromEither(Account.Database.from(res.rows[0]))));
};
exports.create = create;
//# sourceMappingURL=accounts.js.map