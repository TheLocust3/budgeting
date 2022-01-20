"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const router_1 = __importDefault(require("@koa/router"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const pg_1 = require("pg");
const transactions_1 = require("./route/transactions");
const accounts_1 = require("./route/accounts");
const rules_1 = require("./route/rules");
const app = new koa_1.default();
app.context.db = new pg_1.Pool();
const router = new router_1.default();
router.use('/transactions', transactions_1.router.routes(), transactions_1.router.allowedMethods());
router.use('/accounts', accounts_1.router.routes(), accounts_1.router.allowedMethods());
router.use('/rules', rules_1.router.routes(), rules_1.router.allowedMethods());
app.use((0, koa_bodyparser_1.default)());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);
console.log("Listening at localhost:3000");
//# sourceMappingURL=index.js.map