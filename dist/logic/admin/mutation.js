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
exports.CreatePlaidIntegration = void 0;
const A = __importStar(require("fp-ts/Array"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const graphql = __importStar(require("graphql"));
const user_1 = require("../user");
const Types = __importStar(require("../graphql/types"));
const util_1 = require("../graphql/util");
const channel_1 = require("../channel");
const model_1 = require("../../model");
const storage_1 = require("../../storage");
const magic_1 = require("../../magic");
var MakeSuperuser;
(function (MakeSuperuser) {
    const Args = {
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    };
    const resolve = (source, { id }, context) => {
        return (0, pipeable_1.pipe)(storage_1.UserFrontend.setRole(context.pool)(model_1.User.SUPERUSER_ROLE)(id), magic_1.Pipe.toPromise);
    };
    MakeSuperuser.t = {
        type: Types.User.t,
        args: Args,
        resolve: resolve
    };
})(MakeSuperuser || (MakeSuperuser = {}));
var CreatePlaidIntegration;
(function (CreatePlaidIntegration) {
    const Args = {
        userId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        itemId: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        accessToken: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) },
        accounts: { type: new graphql.GraphQLList(Types.PlaidAccount.t) },
        institutionName: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    };
    const resolve = (source, { userId, itemId, accessToken, accounts, institutionName }, context) => {
        return (0, pipeable_1.pipe)(user_1.UserArena.fromId(context.pool)(userId), TE.chain((arena) => {
            return user_1.UserResource.Integration.create(context.pool)(context.id)(arena)({ institutionName: institutionName, accounts: (0, util_1.asList)(accounts) })({ item_id: itemId, access_token: accessToken });
        }), TE.map(() => true), magic_1.Pipe.toPromise);
    };
    CreatePlaidIntegration.t = {
        type: Types.Void.t,
        args: Args,
        resolve: resolve
    };
})(CreatePlaidIntegration = exports.CreatePlaidIntegration || (exports.CreatePlaidIntegration = {}));
var DeleteUser;
(function (DeleteUser) {
    const Args = {
        id: { type: new graphql.GraphQLNonNull(graphql.GraphQLString) }
    };
    const resolve = (source, { id }, context) => {
        magic_1.Reaper.enqueue((job) => {
            console.log(`DeleteUser[${job}] user ${id}`);
            return (0, pipeable_1.pipe)(cleanup(id)(context), TE.match((error) => {
                console.log(`DeleteUser[${job}] failed with ${error}`);
                return false;
            }, () => {
                console.log(`DeleteUser[${job}] complete`);
                return true;
            }));
        });
        return true;
    };
    DeleteUser.t = {
        type: Types.Void.t,
        args: Args,
        resolve: resolve
    };
})(DeleteUser || (DeleteUser = {}));
// TODO: JK really don't want to pull all user's resources into memory
const cleanup = (userId) => (context) => {
    const deleteAll = (deleteById) => (ids) => {
        return (0, pipeable_1.pipe)(ids, TE.map(A.map((id) => deleteById(id))), TE.chain(A.sequence(TE.ApplicativeSeq)), TE.map((_) => { }));
    };
    const cleanupSources = () => {
        return (0, pipeable_1.pipe)(storage_1.SourceFrontend.all(context.pool)(userId), TE.map(A.map((source) => source.id)), deleteAll(storage_1.SourceFrontend.deleteById(context.pool)(userId)));
    };
    const cleanupIntegrations = () => {
        return (0, pipeable_1.pipe)(storage_1.IntegrationFrontend.all(context.pool)(userId), TE.map(A.map((source) => source.id)), deleteAll(storage_1.IntegrationFrontend.deleteById(context.pool)(userId)));
    };
    const cleanupAccounts = () => {
        return (0, pipeable_1.pipe)(channel_1.AccountChannel.all(userId), TE.map(A.map((source) => source.id)), deleteAll(channel_1.AccountChannel.deleteById(userId)));
    };
    const cleanupTransactions = () => {
        return (0, pipeable_1.pipe)(channel_1.TransactionChannel.all(userId), TE.map(A.map((source) => source.id)), deleteAll(channel_1.TransactionChannel.deleteById(userId)));
    };
    return (0, pipeable_1.pipe)(cleanupSources(), TE.chain((_) => cleanupIntegrations()), TE.chain((_) => cleanupAccounts()), TE.chain((_) => cleanupAccounts()), TE.chain((_) => cleanupTransactions()), TE.chain((_) => storage_1.UserFrontend.deleteById(context.pool)(userId)), TE.map((_) => { }));
};
const mutation = new graphql.GraphQLObjectType({
    name: 'Mutation',
    fields: {
        deleteUser: DeleteUser.t,
        makeSuperuser: MakeSuperuser.t,
        createPlaidIntegraton: CreatePlaidIntegration.t
    }
});
exports.default = mutation;
//# sourceMappingURL=mutation.js.map