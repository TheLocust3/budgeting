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
exports.build = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const A = __importStar(require("fp-ts/Array"));
const model_1 = require("../../model");
const magic_1 = require("../../magic");
const buildStage = (account) => {
    const rules = A.map((rule) => rule.rule)(account.rules);
    const attach = (0, pipeable_1.pipe)(rules, A.map(model_1.Rule.Internal.collectAttach), magic_1.Pipe.flattenOption);
    const split = (0, pipeable_1.pipe)(rules, A.map(model_1.Rule.Internal.collectSplit), magic_1.Pipe.flattenOption);
    const include = (0, pipeable_1.pipe)(rules, A.map(model_1.Rule.Internal.collectInclude), magic_1.Pipe.flattenOption);
    if (include.length > 0) { // INVARIANT: rule validation prevents intermixing split + include in a single account
        return {
            _type: "IncludeStage",
            tag: account.id,
            attach: attach,
            include: include,
            children: account.children
        };
    }
    else {
        return {
            _type: "SplitStage",
            tag: account.id,
            attach: attach,
            split: split
        };
    }
};
const build = (accounts) => {
    return { stages: A.map(buildStage)(accounts) };
};
exports.build = build;
//# sourceMappingURL=plan.js.map