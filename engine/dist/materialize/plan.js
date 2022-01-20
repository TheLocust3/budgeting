"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const O = __importStar(require("fp-ts/Option"));
const Rule = __importStar(require("../model/rule"));
const magic_1 = require("magic");
const buildStage = (account) => {
    const accountId = O.match(() => "", (account) => account)(account.id); // TODO: JK should really have a strict "Materialize" Account type
    const rules = A.map((rule) => rule.rule)(account.rules);
    const attach = (0, pipeable_1.pipe)(rules, A.map(Rule.Internal.collectAttach), magic_1.Pipe.flattenOption);
    const split = (0, pipeable_1.pipe)(rules, A.map(Rule.Internal.collectSplit), magic_1.Pipe.flattenOption);
    const include = (0, pipeable_1.pipe)(rules, A.map(Rule.Internal.collectInclude), magic_1.Pipe.flattenOption);
    if (include.length > 0) { // INVARIANT: rule validation prevents intermixing split + include in a single account
        return {
            _type: "IncludeStage",
            tag: accountId,
            attach: attach,
            include: include,
            children: account.children
        };
    }
    else {
        return {
            _type: "SplitStage",
            tag: accountId,
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