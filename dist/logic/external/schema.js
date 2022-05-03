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
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const graphql = __importStar(require("graphql"));
const user_1 = require("../user");
const Types = __importStar(require("../graphql/types"));
const util_1 = require("../util");
const model_1 = require("../../model");
const magic_1 = require("../../magic");
const storage_1 = require("../../storage");
var Login;
(function (Login) {
    const Token = new graphql.GraphQLObjectType({
        name: 'Token',
        fields: {
            token: { type: graphql.GraphQLString }
        }
    });
    const Args = {
        email: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        password: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    };
    const resolve = (source, { email, password }, context) => {
        return (0, pipeable_1.pipe)(storage_1.UserFrontend.login(context.pool)(email, password), TE.map((user) => util_1.JWT.sign(user)), TE.map((token) => ({ token: token })), magic_1.Pipe.toPromise);
    };
    Login.t = {
        type: Token,
        args: Args,
        resolve: resolve
    };
})(Login || (Login = {}));
var CreateUser;
(function (CreateUser) {
    const Args = {
        email: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        password: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    };
    const resolve = (source, { email, password }, context) => {
        return (0, pipeable_1.pipe)(user_1.UserResource.create(context.pool)({ email: email, password: password, role: model_1.User.DEFAULT_ROLE }), magic_1.Pipe.toPromise);
    };
    CreateUser.t = {
        type: Types.User.t,
        args: Args,
        resolve: resolve
    };
})(CreateUser || (CreateUser = {}));
const query = new graphql.GraphQLObjectType({
    name: 'Query',
    fields: {
        _ignore: { type: graphql.GraphQLString } // JK: a single field is required
    }
});
const mutation = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: {
        login: Login.t,
        createUser: CreateUser.t
    }
});
const schema = new graphql.GraphQLSchema({ query: query, mutation: mutation });
exports.default = schema;
//# sourceMappingURL=schema.js.map