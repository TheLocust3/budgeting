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
exports.ExchangePublicToken = exports.CreateLinkToken = void 0;
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const graphql = __importStar(require("graphql"));
const user_1 = require("../../user");
const Types = __importStar(require("../types"));
const util_1 = require("../util");
const magic_1 = require("../../../magic");
var CreateLinkToken;
(function (CreateLinkToken) {
    const Token = new graphql.GraphQLObjectType({
        name: "CreateLinkToken",
        fields: {
            token: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        }
    });
    const resolve = (source, args, context) => {
        return (0, pipeable_1.pipe)(magic_1.Plaid.createLinkToken(context.plaidClient)(context.arena.user.id), TE.map((token) => { return { token: token }; }), magic_1.Pipe.toPromise);
    };
    CreateLinkToken.t = {
        type: Token,
        resolve: resolve
    };
})(CreateLinkToken = exports.CreateLinkToken || (exports.CreateLinkToken = {}));
var ExchangePublicToken;
(function (ExchangePublicToken) {
    const Args = {
        publicToken: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        accounts: { type: new graphql.GraphQLList(Types.PlaidAccount.t) },
        institutionName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    };
    const resolve = (source, { publicToken, accounts, institutionName }, context) => {
        return (0, pipeable_1.pipe)(magic_1.Plaid.exchangePublicToken(context.plaidClient)(publicToken), TE.chain((publicToken) => user_1.UserResource.Integration.create(context.pool)(context.id)(context.arena)({ institutionName: institutionName, accounts: (0, util_1.asList)(accounts) })(publicToken)), TE.map(() => true), magic_1.Pipe.toPromise);
    };
    ExchangePublicToken.t = {
        type: Types.Void.t,
        args: Args,
        resolve: resolve
    };
})(ExchangePublicToken = exports.ExchangePublicToken || (exports.ExchangePublicToken = {}));
//# sourceMappingURL=plaid-mutation.js.map