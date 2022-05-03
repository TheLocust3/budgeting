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
exports.pool = void 0;
const pg_1 = require("pg");
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const constants_1 = require("./constants");
const storage_1 = require("../storage");
const createUser = (pool) => (email, password, role) => {
    return (0, pipeable_1.pipe)(storage_1.UserFrontend.getByEmail(pool)(email), TE.orElse(() => storage_1.UserFrontend.create(pool)({ email: email, password: password, role: role })));
};
const migrate = async (pool) => {
    await (0, pipeable_1.pipe)(TE.Do, TE.bind("user", () => createUser(pool)("jake.kinsella@gmail.com", "foobar", "superuser")), TE.bind("globalAccount", ({ user }) => storage_1.AccountFrontend.create(pool)({ parentId: O.none, userId: user.id, name: constants_1.GLOBAL_ACCOUNT })), TE.bind("globalRule", ({ user, globalAccount }) => {
        return storage_1.RuleFrontend.create(pool)({
            accountId: globalAccount.id,
            userId: user.id,
            rule: { _type: "Include", where: { _type: "StringMatch", field: "userId", operator: "Eq", value: user.id } }
        });
    }), TE.bind("physicalAccount", ({ user, globalAccount }) => storage_1.AccountFrontend.create(pool)({ parentId: O.some(globalAccount.id), userId: user.id, name: constants_1.PHYSICAL_ACCOUNT })), TE.bind("virtualAccount", ({ user, globalAccount }) => storage_1.AccountFrontend.create(pool)({ parentId: O.some(globalAccount.id), userId: user.id, name: constants_1.VIRTUAL_ACCOUNT })), TE.map(({ user }) => {
        console.log(`User created ${user.email}`);
    }), TE.mapLeft((error) => {
        console.log(`User creation failed`);
        console.log(error);
    }))();
    console.log("Migrate complete");
    process.exit(0);
};
console.log("Migrate start");
exports.pool = new pg_1.Pool();
migrate(exports.pool);
//# sourceMappingURL=migrate.js.map