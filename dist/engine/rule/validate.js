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
const A = __importStar(require("fp-ts/Array"));
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const storage_1 = require("../../storage");
const magic_1 = require("../../magic");
var Validate;
(function (Validate) {
    const splitByPercent = (context) => (body) => {
        const validAccounts = A.reduce(true, (acc, split) => acc && context.account.children.includes(split.account))(body.splits);
        const total = A.reduce(0, (acc, split) => acc + split.percent)(body.splits);
        return validAccounts && total === 1;
    };
    const splitByValue = (context) => (body) => {
        const validAccounts = A.reduce(true, (acc, split) => acc && context.account.children.includes(split.account))(body.splits);
        const validRemainder = context.account.children.includes(body.remainder);
        return validAccounts && validRemainder;
    };
    const include = (context) => (body) => {
        return !A.exists((rule) => rule.rule._type !== "Attach" && rule.rule._type !== "Include")(context.account.rules); // include cannot be used with splits
    };
    const buildContext = (pool) => (body) => {
        return (0, pipeable_1.pipe)(body.accountId, storage_1.AccountFrontend.getById(pool), TE.chain(storage_1.AccountFrontend.withRules(pool)), TE.chain(storage_1.AccountFrontend.withChildren(pool)), TE.map((account) => { return { account: account }; }));
    };
    Validate.rule = (pool) => (body) => {
        const inner = body.rule;
        return (0, pipeable_1.pipe)(body, buildContext(pool), TE.chain((context) => {
            switch (inner._type) {
                case "Attach":
                    return TE.of(body); // no validation on `Attach`
                case "SplitByPercent":
                    if (splitByPercent(context)(inner)) {
                        return TE.of(body);
                    }
                    else {
                        return TE.throwError(magic_1.Exception.throwInvalidRule);
                    }
                case "SplitByValue":
                    if (splitByValue(context)(inner)) {
                        return TE.of(body);
                    }
                    else {
                        return TE.throwError(magic_1.Exception.throwInvalidRule);
                    }
                case "Include":
                    if (include(context)(inner)) {
                        return TE.of(body);
                    }
                    else {
                        return TE.throwError(magic_1.Exception.throwInvalidRule);
                    }
            }
        }));
    };
})(Validate || (Validate = {}));
exports.default = Validate;
//# sourceMappingURL=validate.js.map