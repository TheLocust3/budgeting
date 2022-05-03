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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const plaid_1 = require("plaid");
const Reaper = __importStar(require("./reaper/index"));
const root_1 = require("./route/root");
const plaidConfig = new plaid_1.Configuration({
    basePath: plaid_1.PlaidEnvironments.development,
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
app.use(express_1.default.json());
app.use("/", root_1.router.router);
const port = process.env.PORT ? process.env.PORT : 8080;
app.listen(port);
console.log(`Listening at localhost:${port}`);
Reaper.tick(app.locals.db)(app.locals.plaidClient);
//# sourceMappingURL=index.js.map