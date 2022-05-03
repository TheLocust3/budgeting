"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const pg_1 = require("pg");
const plaid_1 = require("plaid");
const index_1 = __importDefault(require("./graphql/index"));
const index_2 = __importDefault(require("./admin/index"));
const index_3 = __importDefault(require("./external/index"));
const util_1 = require("./util");
const root_1 = require("./route/root");
const plaidConfig = new plaid_1.Configuration({
    basePath: plaid_1.PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET
        },
    },
});
const plaidClient = new plaid_1.PlaidApi(plaidConfig);
const app = (0, express_1.default)();
app.locals.db = new pg_1.Pool();
app.locals.plaidClient = plaidClient;
app.use(async (request, response, next) => {
    const start = Date.now();
    response.locals.id = crypto_1.default.randomUUID();
    console.log(`[${response.locals.id}] ${request.method}: ${request.url}`);
    await next();
    const took = Date.now() - start;
    console.log(`[${response.locals.id}] took ${took}ms`);
});
app.use((0, cors_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use("/", root_1.router.router);
app.use("/external/graphql", index_3.default);
app.use(util_1.AuthenticationFor.user);
app.use("/graphql", index_1.default);
app.use(util_1.AuthenticationFor.admin);
app.use("/admin/graphql", index_2.default);
const port = process.env.PORT ? process.env.PORT : 8080;
app.listen(port);
console.log(`Listening at localhost:${port}`);
//# sourceMappingURL=index.js.map