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
exports.pool = void 0;
const pg_1 = require("pg");
const UsersTable = __importStar(require("./users-table"));
const SourcesTable = __importStar(require("./sources-table"));
const IntegrationsTable = __importStar(require("./integrations-table"));
const TransactionsTable = __importStar(require("./transactions-table"));
const AccountsTable = __importStar(require("./accounts-table"));
const RulesTable = __importStar(require("./rules-table"));
const migrate = async (pool) => {
    await UsersTable.migrate(pool)();
    await IntegrationsTable.migrate(pool)();
    await SourcesTable.migrate(pool)();
    await TransactionsTable.migrate(pool)();
    await AccountsTable.migrate(pool)();
    await RulesTable.migrate(pool)();
    console.log("Migrate complete");
    process.exit(0);
};
console.log("Migrate start");
exports.pool = new pg_1.Pool();
migrate(exports.pool);
//# sourceMappingURL=migrate.js.map