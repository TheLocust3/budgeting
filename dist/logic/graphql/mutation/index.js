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
exports.mutationType = void 0;
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const graphql = __importStar(require("graphql"));
const user_1 = require("../../user");
const Types = __importStar(require("../types"));
const PlaidMutation = __importStar(require("./plaid-mutation"));
const magic_1 = require("../../../magic");
var CreateBucket;
(function (CreateBucket) {
    const JustBucket = new graphql.GraphQLObjectType({
        name: 'JustBucket',
        fields: {
            id: { type: graphql.GraphQLString },
            name: { type: graphql.GraphQLString }
        }
    });
    const Args = { name: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };
    const resolve = (source, { name }, context) => {
        return (0, pipeable_1.pipe)(user_1.UserResource.Bucket.create(context.arena)(name), magic_1.Pipe.toPromise);
    };
    CreateBucket.t = {
        type: JustBucket,
        args: Args,
        resolve: resolve
    };
})(CreateBucket || (CreateBucket = {}));
var CreateSplitByValue;
(function (CreateSplitByValue) {
    const Value = new graphql.GraphQLInputObjectType({
        name: "Value",
        fields: {
            bucket: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
            value: { type: new graphql.GraphQLNonNull(graphql.GraphQLFloat) }
        }
    });
    const Args = {
        transactionId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        splits: { type: new graphql.GraphQLList(Value) },
        remainder: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    };
    const resolve = (source, { transactionId, splits, remainder }, context) => {
        return (0, pipeable_1.pipe)(user_1.UserResource.Rule.splitTransaction(context.arena)(transactionId, splits, remainder), magic_1.Pipe.toPromise);
    };
    CreateSplitByValue.t = {
        type: Types.Rule.t,
        args: Args,
        resolve: resolve
    };
})(CreateSplitByValue || (CreateSplitByValue = {}));
var DeleteRule;
(function (DeleteRule) {
    const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };
    const resolve = (source, { id }, context) => {
        return (0, pipeable_1.pipe)(user_1.UserResource.Rule.remove(context.arena)(id), TE.map(() => true), magic_1.Pipe.toPromise);
    };
    DeleteRule.t = {
        type: Types.Void.t,
        args: Args,
        resolve: resolve
    };
})(DeleteRule || (DeleteRule = {}));
var DeleteIntegration;
(function (DeleteIntegration) {
    const Args = { id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) } };
    const resolve = (source, { id }, context) => {
        return (0, pipeable_1.pipe)(user_1.UserResource.Integration.remove(context.pool)(context.arena)(id), TE.map(() => true), magic_1.Pipe.toPromise);
    };
    DeleteIntegration.t = {
        type: Types.Void.t,
        args: Args,
        resolve: resolve
    };
})(DeleteIntegration || (DeleteIntegration = {}));
exports.mutationType = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: {
        createBucket: CreateBucket.t,
        createSplitByValue: CreateSplitByValue.t,
        deleteRule: DeleteRule.t,
        deleteIntegration: DeleteIntegration.t,
        createLinkToken: PlaidMutation.CreateLinkToken.t,
        exchangePublicToken: PlaidMutation.ExchangePublicToken.t
    }
});
exports.default = exports.mutationType;
//# sourceMappingURL=index.js.map