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
const O = __importStar(require("fp-ts/Option"));
const buildStringPredicate = (field) => (pred) => {
    return (transaction) => pred(transaction[field]);
};
const buildNumberPredicate = (field) => (pred) => {
    if (field === "capturedAt") {
        return (transaction) => O.match(() => false, (capturedAt) => pred(capturedAt.getTime()))(transaction.capturedAt);
    }
    else if (field === "authorizedAt") {
        return (transaction) => pred(transaction[field].getTime());
    }
    else {
        return (transaction) => pred(transaction[field]);
    }
};
const buildStringMatch = (rule) => {
    switch (rule.operator) {
        case "Eq":
            return buildStringPredicate(rule.field)((value) => value === rule.value);
        case "Neq":
            return buildStringPredicate(rule.field)((value) => value !== rule.value);
    }
};
const buildNumberMatch = (rule) => {
    switch (rule.operator) {
        case "Eq":
            return buildNumberPredicate(rule.field)((value) => value === rule.value);
        case "Neq":
            return buildNumberPredicate(rule.field)((value) => value !== rule.value);
        case "Gt":
            return buildNumberPredicate(rule.field)((value) => value > rule.value);
        case "Lt":
            return buildNumberPredicate(rule.field)((value) => value < rule.value);
        case "Gte":
            return buildNumberPredicate(rule.field)((value) => value >= rule.value);
        case "Lte":
            return buildNumberPredicate(rule.field)((value) => value <= rule.value);
    }
};
const buildExists = (rule) => {
    return (transaction) => O.match(() => false, (_) => true)(transaction[rule.field]);
};
const buildStringGlob = (rule) => {
    const matcher = new RegExp(rule.value.replaceAll("*", "(.*)")); // TODO: JK might need to escape some stuff
    return (transaction) => matcher.test(transaction[rule.field]);
};
const buildClause = (clause) => {
    switch (clause._type) {
        case "And":
            const left = buildClause(clause.left);
            const right = buildClause(clause.right);
            return (transaction) => left(transaction) && right(transaction);
        case "Not":
            const inner = buildClause(clause.clause);
            return (transaction) => !inner(transaction);
        case "StringMatch":
            const stringMatch = buildStringMatch(clause);
            return (transaction) => stringMatch(transaction);
        case "NumberMatch":
            const numberMatch = buildNumberMatch(clause);
            return (transaction) => numberMatch(transaction);
        case "Exists":
            const exists = buildExists(clause);
            return (transaction) => exists(transaction);
        case "StringGlob":
            const stringGlob = buildStringGlob(clause);
            return (transaction) => stringGlob(transaction);
    }
};
const buildAttach = (rule) => {
    const where = buildClause(rule.where);
    return (transaction) => {
        if (where(transaction)) {
            try {
                return {
                    ...transaction,
                    custom: { ...transaction.custom, [rule.field]: transaction.custom[rule.field].concat(rule.value) }
                };
            }
            catch (_) { // if [rule.field] key doesn't exist
                return {
                    ...transaction,
                    custom: { ...transaction.custom, [rule.field]: [rule.value] }
                };
            }
        }
        else {
            return transaction;
        }
    };
};
const buildSplitByPercent = (rule) => {
    const where = buildClause(rule.where);
    return (transaction) => {
        if (where(transaction)) {
            const tagged = A.map((split) => {
                const splitTransaction = { ...transaction, amount: transaction.amount * split.percent };
                return { _type: "Tagged", tag: split.account, element: splitTransaction };
            })(rule.splits);
            return O.some({ _type: "TaggedSet", elements: tagged });
        }
        else {
            return O.none;
        }
    };
};
const buildSplitByValue = (rule) => {
    const where = buildClause(rule.where);
    return (transaction) => {
        if (where(transaction)) {
            const [remaining, tagged] = A.reduce([transaction.amount, []], ([remaining, tagged], split) => {
                if (remaining > 0) {
                    if (remaining >= split.value) {
                        const splitTransaction = { ...transaction, amount: split.value };
                        return [remaining - split.value, tagged.concat({ _type: "Tagged", tag: split.account, element: splitTransaction })];
                    }
                    else {
                        const splitTransaction = { ...transaction, amount: remaining };
                        return [0, tagged.concat({ _type: "Tagged", tag: split.account, element: splitTransaction })];
                    }
                }
                else {
                    return [0, tagged];
                }
            })(rule.splits);
            if (remaining > 0) {
                const splitTransaction = { ...transaction, amount: remaining };
                return O.some({
                    _type: "TaggedSet",
                    elements: tagged.concat({ _type: "Tagged", tag: rule.remainder, element: splitTransaction })
                });
            }
            else {
                return O.some({ _type: "TaggedSet", elements: tagged });
            }
        }
        else {
            return O.none;
        }
    };
};
const buildSplit = (rule) => {
    switch (rule._type) {
        case "SplitByPercent":
            return buildSplitByPercent(rule);
        case "SplitByValue":
            return buildSplitByValue(rule);
    }
};
const buildInclude = (rule) => {
    return buildClause(rule.where);
};
const buildAttachFlow = (attach) => {
    const attachFlows = A.map(buildAttach)(attach);
    return (transaction) => (0, pipeable_1.pipe)(attachFlows, A.reduce(transaction, (out, flow) => flow(out)));
};
const buildSplitFlow = (split) => {
    const splitFlows = A.map((split) => {
        return [split, buildSplit(split)];
    })(split);
    return (transaction) => {
        const [_, out] = (0, pipeable_1.pipe)(splitFlows, A.map(([split, flow]) => [split, flow(transaction)]), A.reduce([O.none, { _type: "Untagged", element: transaction }], ([last, out], [split, maybeTagged]) => O.match(() => [last, out], (tagged) => {
            switch (out._type) {
                case "Conflict":
                    return [O.some(split), { ...out, rules: out.rules.concat(split) }];
                case "TaggedSet":
                    const rules = O.match(() => [], (last) => [last])(last).concat(split);
                    return [O.some(split), { _type: "Conflict", element: transaction, rules: rules }];
                case "Untagged":
                    return [O.some(split), tagged];
            }
        })(maybeTagged)));
        return out;
    };
};
const buildIncludeFlow = (include) => {
    const includeFlows = A.map(buildInclude)(include);
    return (transaction) => {
        return (0, pipeable_1.pipe)(includeFlows, A.map((flow) => flow(transaction)), A.reduce(O.none, (out, keep) => {
            if (keep) {
                return O.some(transaction);
            }
            else {
                return out;
            }
        }));
    };
};
const buildSplitStage = (stage) => {
    const attachFlow = buildAttachFlow(stage.attach);
    const splitFlow = buildSplitFlow(stage.split);
    return (transaction) => {
        return (0, pipeable_1.pipe)(transaction, attachFlow, splitFlow);
    };
};
const buildIncludeStage = (stage) => {
    const attachFlow = buildAttachFlow(stage.attach);
    const includeFlow = buildIncludeFlow(stage.include);
    return (transaction) => {
        return (0, pipeable_1.pipe)(transaction, attachFlow, includeFlow, O.match(() => {
            return { _type: "TaggedSet", elements: [] };
        }, (element) => {
            return {
                _type: "TaggedSet",
                elements: A.map((child) => {
                    return { _type: "Tagged", tag: child, element: element };
                })(stage.children)
            };
        }));
    };
};
const build = (stage) => {
    switch (stage._type) {
        case "SplitStage":
            return buildSplitStage(stage);
        case "IncludeStage":
            return buildIncludeStage(stage);
    }
};
exports.build = build;
//# sourceMappingURL=materializer.js.map