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
exports.create = exports.deleteById = exports.byId = exports.byAccountId = exports.rollback = exports.migrate = void 0;
const function_1 = require("fp-ts/lib/function");
const A = __importStar(require("fp-ts/Array"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/lib/TaskEither"));
const Rule = __importStar(require("../model/Rule"));
const magic_1 = require("magic");
var Query;
(function (Query) {
    Query.createTable = `
    CREATE TABLE rules (
      id TEXT NOT NULL UNIQUE PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id TEXT NOT NULL,
      rule JSONB NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id)
    )
  `;
    Query.dropTable = `DROP TABLE rules`;
    Query.create = (accountId, rule) => {
        return {
            text: `
        INSERT INTO rules (account_id, rule)
        VALUES ($1, $2)
        RETURNING *
      `,
            values: [accountId, rule]
        };
    };
    Query.byAccountId = (accountId) => {
        return {
            text: `
        SELECT id, account_id, rule
        FROM rules
        WHERE account_id = $1
      `,
            values: [accountId]
        };
    };
    Query.byId = (id) => {
        return {
            text: `
        SELECT id, account_id, rule
        FROM rules
        WHERE id = $1
        LIMIT 1
      `,
            values: [id]
        };
    };
    Query.deleteById = (id) => {
        return {
            text: `
        DELETE FROM rules
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
const byAccountId = (pool) => (accountId) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byAccountId(accountId)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(Rule.Database.from), A.sequence(E.Applicative)))));
};
exports.byAccountId = byAccountId;
const byId = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.byId(id)), E.toError), TE.chain(res => TE.fromEither((0, function_1.pipe)(res.rows, A.map(Rule.Database.from), A.sequence(E.Applicative)))), TE.map(A.lookup(0)));
};
exports.byId = byId;
const deleteById = (pool) => (id) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.deleteById(id)), E.toError), TE.map(x => { return; }));
};
exports.deleteById = deleteById;
const create = (pool) => (rule) => {
    return (0, function_1.pipe)(TE.tryCatch(() => pool.query(Query.create(rule.accountId, rule.rule)), E.toError), magic_1.Db.expectOne, TE.chain(res => TE.fromEither(Rule.Database.from(res.rows[0]))));
};
exports.create = create;
//# sourceMappingURL=rules.js.map