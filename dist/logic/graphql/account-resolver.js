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
exports.Buckets = exports.Accounts = void 0;
const A = __importStar(require("fp-ts/Array"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const graphql = __importStar(require("graphql"));
const user_1 = require("../user");
const transaction_resolver_1 = require("./transaction-resolver");
const rule_resolver_1 = require("./rule-resolver");
const magic_1 = require("../../magic");
const resolveFor = (key) => (context) => {
    switch (key) {
        case "physical":
            return user_1.UserArena.physical(context.arena);
        case "virtual":
            return user_1.UserArena.virtual(context.arena);
    }
};
const resolveChildrenFor = (key) => (source, args, context) => {
    return (0, pipeable_1.pipe)(resolveFor(key)(context), TE.map((context) => {
        return A.map((child) => child.account)(context.children);
    }), magic_1.Pipe.toPromise);
};
var Accounts;
(function (Accounts) {
    Accounts.t = {
        type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
            name: 'Account',
            fields: {
                id: { type: graphql.GraphQLString },
                name: { type: graphql.GraphQLString },
                transactions: transaction_resolver_1.Transactions.Physical.t
            }
        })),
        resolve: resolveChildrenFor("physical")
    };
})(Accounts = exports.Accounts || (exports.Accounts = {}));
var Buckets;
(function (Buckets) {
    Buckets.t = {
        type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
            name: 'Bucket',
            fields: {
                id: { type: graphql.GraphQLString },
                name: { type: graphql.GraphQLString },
                rules: rule_resolver_1.Rules.Virtual.t,
                transactions: transaction_resolver_1.Transactions.Virtual.t
            }
        })),
        resolve: resolveChildrenFor("virtual")
    };
})(Buckets = exports.Buckets || (exports.Buckets = {}));
//# sourceMappingURL=account-resolver.js.map