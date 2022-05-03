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
exports.resolve = void 0;
const A = __importStar(require("fp-ts/Array"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const storage_1 = require("../../../storage");
const resolve = (pool) => (arena) => {
    const withSources = (integration) => {
        console.log(integration);
        return (0, pipeable_1.pipe)(storage_1.SourceFrontend.allByIntegrationId(pool)(arena.user.id)(integration.id), TE.map((sources) => ({ integration: integration, sources: sources })));
    };
    return (0, pipeable_1.pipe)(storage_1.IntegrationFrontend.all(pool)(arena.user.id), TE.chain((integrations) => {
        return (0, pipeable_1.pipe)(integrations, A.map(withSources), A.sequence(TE.ApplicativeSeq));
    }));
};
exports.resolve = resolve;
//# sourceMappingURL=integration-arena.js.map