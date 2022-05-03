"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const transactions_1 = require("./route/transactions");
const accounts_1 = require("./route/accounts");
const rules_1 = require("./route/rules");
const root_1 = require("./route/root");
const app = (0, express_1.default)();
app.locals.db = new pg_1.Pool();
app.use((request, response, next) => {
    const start = Date.now();
    response.locals.id = crypto_1.default.randomUUID();
    console.log(`[${response.locals.id}] ${request.method}: ${request.url}`);
    next();
    const took = Date.now() - start;
    console.log(`[${response.locals.id}] took ${took}ms`);
});
app.use(express_1.default.json());
app.use("/channel/transactions", transactions_1.router.router);
app.use("/channel/accounts", accounts_1.router.router);
app.use("/channel/rules", rules_1.router.router);
app.use("/", root_1.router.router);
const port = process.env.PORT ? process.env.PORT : 8080;
app.listen(port);
console.log(`Listening at localhost:${port}`);
//# sourceMappingURL=index.js.map