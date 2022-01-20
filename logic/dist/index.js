"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const router_1 = __importDefault(require("@koa/router"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const pg_1 = require("pg");
const users_1 = require("./route/users");
const app = new koa_1.default();
app.context.db = new pg_1.Pool();
const router = new router_1.default();
router.use('/users', users_1.router.routes(), users_1.router.allowedMethods());
app.use((0, koa_bodyparser_1.default)());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3001);
console.log("Listening at localhost:3001");
//# sourceMappingURL=index.js.map