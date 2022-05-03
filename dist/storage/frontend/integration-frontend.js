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
exports.IntegrationFrontend = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const IntegrationTable = __importStar(require("../db/integrations-table"));
const magic_1 = require("../../magic");
var IntegrationFrontend;
(function (IntegrationFrontend) {
    IntegrationFrontend.all = (pool) => (userId) => {
        return (0, pipeable_1.pipe)(IntegrationTable.all(pool)(userId), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    IntegrationFrontend.getById = (pool) => (id) => {
        return (0, pipeable_1.pipe)(id, IntegrationTable.byId(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (integration) => TE.of(integration))));
    };
    IntegrationFrontend.getByIdAndUserId = (pool) => (userId) => (id) => {
        return (0, pipeable_1.pipe)(IntegrationFrontend.getById(pool)(id), TE.chain((integration) => {
            if (integration.userId == userId) {
                return TE.of(integration);
            }
            else {
                return TE.throwError(magic_1.Exception.throwNotFound);
            }
        }));
    };
    IntegrationFrontend.create = (pool) => (integration) => {
        return (0, pipeable_1.pipe)(integration, IntegrationTable.create(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    IntegrationFrontend.deleteById = (pool) => (userId) => (id) => {
        return (0, pipeable_1.pipe)(id, IntegrationTable.deleteById(pool)(userId), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
})(IntegrationFrontend = exports.IntegrationFrontend || (exports.IntegrationFrontend = {}));
exports.default = IntegrationFrontend;
//# sourceMappingURL=integration-frontend.js.map