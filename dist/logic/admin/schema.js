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
const pipeable_1 = require("fp-ts/lib/pipeable");
const graphql = __importStar(require("graphql"));
const mutation_1 = __importDefault(require("./mutation"));
const Types = __importStar(require("../graphql/types"));
const magic_1 = require("../../magic");
const storage_1 = require("../../storage");
var ListUsers;
(function (ListUsers) {
    const resolve = (source, args, context) => {
        return (0, pipeable_1.pipe)(storage_1.UserFrontend.all(context.pool)(), magic_1.Pipe.toPromise);
    };
    ListUsers.t = {
        type: new graphql.GraphQLList(Types.User.t),
        resolve: resolve
    };
})(ListUsers || (ListUsers = {}));
var GetUser;
(function (GetUser) {
    const Args = {
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    };
    const resolve = (source, { id }, context) => {
        return (0, pipeable_1.pipe)(storage_1.UserFrontend.getById(context.pool)(id), magic_1.Pipe.toPromise);
    };
    GetUser.t = {
        type: Types.User.t,
        args: Args,
        resolve: resolve
    };
})(GetUser || (GetUser = {}));
const query = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
        users: ListUsers.t,
        user: GetUser.t
    }
});
const schema = new graphql.GraphQLSchema({ query: query, mutation: mutation_1.default });
exports.default = schema;
//# sourceMappingURL=schema.js.map