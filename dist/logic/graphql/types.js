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
exports.PlaidAccount = exports.Void = exports.Account = exports.Transaction = exports.Rule = exports.Integration = exports.User = void 0;
const graphql = __importStar(require("graphql"));
const graphql_type_json_1 = require("graphql-type-json");
var User;
(function (User) {
    User.t = new graphql.GraphQLObjectType({
        name: 'User',
        fields: {
            id: { type: graphql.GraphQLString },
            email: { type: graphql.GraphQLString }
        }
    });
})(User = exports.User || (exports.User = {}));
var Integration;
(function (Integration) {
    const Source = new graphql.GraphQLObjectType({
        name: 'Source',
        fields: {
            id: { type: graphql.GraphQLString },
            name: { type: graphql.GraphQLString }
        }
    });
    Integration.t = new graphql.GraphQLObjectType({
        name: 'Integration',
        fields: {
            id: { type: graphql.GraphQLString },
            name: { type: graphql.GraphQLString },
            sources: { type: new graphql.GraphQLList(Source) }
        }
    });
})(Integration = exports.Integration || (exports.Integration = {}));
var Rule;
(function (Rule) {
    Rule.t = new graphql.GraphQLObjectType({
        name: 'Rule',
        fields: {
            id: { type: graphql.GraphQLString },
            rule: { type: graphql_type_json_1.GraphQLJSONObject }
        }
    });
})(Rule = exports.Rule || (exports.Rule = {}));
var Transaction;
(function (Transaction) {
    Transaction.t = new graphql.GraphQLObjectType({
        name: 'Transaction',
        fields: {
            id: { type: graphql.GraphQLString },
            sourceId: { type: graphql.GraphQLString },
            amount: { type: graphql.GraphQLFloat },
            merchantName: { type: graphql.GraphQLString },
            description: { type: graphql.GraphQLString },
            authorizedAt: { type: graphql.GraphQLInt },
            capturedAt: { type: graphql.GraphQLInt }
        }
    });
})(Transaction = exports.Transaction || (exports.Transaction = {}));
var Account;
(function (Account) {
    Account.t = new graphql.GraphQLObjectType({
        name: 'Transaction',
        fields: {
            id: { type: graphql.GraphQLString },
            name: { type: graphql.GraphQLString }
        }
    });
})(Account = exports.Account || (exports.Account = {}));
var Void;
(function (Void) {
    Void.t = graphql.GraphQLBoolean;
})(Void = exports.Void || (exports.Void = {}));
var PlaidAccount;
(function (PlaidAccount) {
    PlaidAccount.t = new graphql.GraphQLInputObjectType({
        name: "PlaidAccount",
        fields: {
            id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
            name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
        }
    });
})(PlaidAccount = exports.PlaidAccount || (exports.PlaidAccount = {}));
//# sourceMappingURL=types.js.map