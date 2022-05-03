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
exports.SourceFrontend = void 0;
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const SourcesTable = __importStar(require("../db/sources-table"));
const magic_1 = require("../../magic");
var SourceFrontend;
(function (SourceFrontend) {
    SourceFrontend.all = (pool) => (userId) => {
        return (0, pipeable_1.pipe)(SourcesTable.all(pool)(userId), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    SourceFrontend.getById = (pool) => (userId) => (id) => {
        return (0, pipeable_1.pipe)(id, SourcesTable.byId(pool)(userId), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (source) => TE.of(source))));
    };
    SourceFrontend.allByIntegrationId = (pool) => (userId) => (integrationId) => {
        return (0, pipeable_1.pipe)(SourcesTable.byIntegrationId(pool)(userId)(integrationId), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    SourceFrontend.create = (pool) => (source) => {
        return (0, pipeable_1.pipe)(source, SourcesTable.create(pool), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    SourceFrontend.deleteById = (pool) => (userId) => (id) => {
        return (0, pipeable_1.pipe)(id, SourcesTable.deleteById(pool)(userId), TE.mapLeft((_) => magic_1.Exception.throwInternalError));
    };
    SourceFrontend.pull = (pool) => () => {
        return (0, pipeable_1.pipe)(SourcesTable.pull(pool)(), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (source) => TE.of(source))));
    };
    SourceFrontend.pullForRollup = (pool) => () => {
        return (0, pipeable_1.pipe)(SourcesTable.pullForRollup(pool)(), TE.mapLeft((_) => magic_1.Exception.throwInternalError), TE.chain(O.fold(() => TE.throwError(magic_1.Exception.throwNotFound), (source) => TE.of(source))));
    };
})(SourceFrontend = exports.SourceFrontend || (exports.SourceFrontend = {}));
exports.default = SourceFrontend;
//# sourceMappingURL=source-frontend.js.map