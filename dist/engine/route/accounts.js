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
exports.router = void 0;
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const Materialize = __importStar(require("../materialize/index"));
const model_1 = require("../../model");
const storage_1 = require("../../storage");
const magic_1 = require("../../magic");
exports.router = new magic_1.Route.Router();
exports.router
    .get("/", (context) => {
    return (0, pipeable_1.pipe)(magic_1.Route.parseQuery(context)(model_1.Account.Channel.Query.Json), TE.chain(({ userId }) => storage_1.AccountFrontend.all(context.request.app.locals.db)(userId)), TE.map((accounts) => { return { accounts: accounts }; }), magic_1.Route.respondWith(context)(model_1.Account.Channel.Response.AccountList.Json));
});
exports.router
    .get("/:accountId", (context) => {
    const accountId = context.request.params.accountId;
    return (0, pipeable_1.pipe)(magic_1.Route.parseQuery(context)(model_1.Account.Channel.Query.Json), TE.chain(({ userId }) => storage_1.AccountFrontend.getByIdAndUserId(context.request.app.locals.db)(userId)(accountId)), magic_1.Route.respondWith(context)(model_1.Account.Internal.Json));
});
exports.router
    .get("/:accountId/materialize", (context) => {
    const accountId = context.request.params.accountId;
    return (0, pipeable_1.pipe)(magic_1.Route.parseQuery(context)(model_1.Account.Channel.Query.Json), TE.chain(({ userId }) => storage_1.AccountFrontend.getByIdAndUserId(context.request.app.locals.db)(userId)(accountId)), TE.chain(storage_1.AccountFrontend.withRules(context.request.app.locals.db)), TE.chain(storage_1.AccountFrontend.withChildren(context.request.app.locals.db)), TE.chain((account) => Materialize.execute(context.response.locals.id)(context.request.app.locals.db)(account)), magic_1.Route.respondWith(context)(model_1.Materialize.Internal.Json));
});
exports.router
    .post("/", (context) => {
    return (0, pipeable_1.pipe)(magic_1.Route.parseBody(context)(model_1.Account.Frontend.Create.Json), TE.chain(storage_1.AccountFrontend.create(context.request.app.locals.db)), magic_1.Route.respondWith(context)(model_1.Account.Internal.Json));
});
exports.router
    .delete("/:accountId", (context) => {
    const accountId = context.request.params.accountId;
    return (0, pipeable_1.pipe)(magic_1.Route.parseQuery(context)(model_1.Account.Channel.Query.Json), TE.chain(({ userId }) => storage_1.AccountFrontend.deleteById(context.request.app.locals.db)(userId)(accountId)), magic_1.Route.respondWithOk(context));
});
//# sourceMappingURL=accounts.js.map