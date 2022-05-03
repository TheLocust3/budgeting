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
exports.UserFrontend = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const UsersTable = __importStar(require("../db/users-table"));
const magic_1 = require("../../magic");
var UserFrontend;
(function (UserFrontend) {
    UserFrontend.all = (pool) => () => {
        return (0, pipeable_1.pipe)(UsersTable.all(pool)(), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    UserFrontend.getById = (pool) => (id) => {
        return (0, pipeable_1.pipe)(id, UsersTable.byId(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (user) => TE.of(user))));
    };
    UserFrontend.getByEmail = (pool) => (email) => {
        return (0, pipeable_1.pipe)(email, UsersTable.byEmail(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (user) => TE.of(user))));
    };
    UserFrontend.create = (pool) => (user) => {
        return (0, pipeable_1.pipe)(TE.tryCatch(() => bcrypt_1.default.hash(user.password, 10), E.toError), TE.map((hashed) => { return { ...user, password: hashed }; }), TE.chain(UsersTable.create(pool)), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    UserFrontend.deleteById = (pool) => (id) => {
        return (0, pipeable_1.pipe)(id, UsersTable.deleteById(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    UserFrontend.login = (pool) => (email, password) => {
        return (0, pipeable_1.pipe)(TE.Do, TE.bind("user", () => UserFrontend.getByEmail(pool)(email)), TE.bind("match", ({ user }) => TE.tryCatch(() => bcrypt_1.default.compare(password, user.password), () => magic_1.Exception.throwInternalError)), TE.chain(({ user, match }) => {
            if (match) {
                return TE.of(user);
            }
            else {
                return TE.throwError(magic_1.Exception.throwNotFound);
            }
        }));
    };
    UserFrontend.setRole = (pool) => (role) => (id) => {
        return (0, pipeable_1.pipe)(UsersTable.setRole(pool)(role)(id), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
})(UserFrontend = exports.UserFrontend || (exports.UserFrontend = {}));
exports.default = UserFrontend;
//# sourceMappingURL=user-frontend.js.map