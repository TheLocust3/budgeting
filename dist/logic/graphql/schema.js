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
const graphql = __importStar(require("graphql"));
const UserResolver = __importStar(require("./user-resolver"));
const AccountResolver = __importStar(require("./account-resolver"));
const TransactionResolver = __importStar(require("./transaction-resolver"));
const IntegrationsResolver = __importStar(require("./integrations-resolver"));
const index_1 = __importDefault(require("./mutation/index"));
const queryType = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
        user: UserResolver.t,
        accounts: AccountResolver.Accounts.t,
        buckets: AccountResolver.Buckets.t,
        untagged: TransactionResolver.Untagged.t,
        conflicts: TransactionResolver.Conflicts.t,
        integrations: IntegrationsResolver.t
    }
});
const schema = new graphql.GraphQLSchema({ query: queryType, mutation: index_1.default });
exports.default = schema;
//# sourceMappingURL=schema.js.map