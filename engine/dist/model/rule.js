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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.Json = exports.Internal = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const iot = __importStar(require("io-ts"));
const camelcase_keys_1 = __importDefault(require("camelcase-keys"));
const Transaction = __importStar(require("../model/transaction"));
const magic_1 = require("magic");
var Internal;
(function (Internal) {
    Internal.collectAttach = (rule) => {
        switch (rule._type) {
            case "Attach":
                return O.some(rule);
            case "SplitByPercent":
                return O.none;
            case "SplitByValue":
                return O.none;
            case "Include":
                return O.none;
        }
    };
    Internal.collectSplit = (rule) => {
        switch (rule._type) {
            case "Attach":
                return O.none;
            case "SplitByPercent":
                return O.some(rule);
            case "SplitByValue":
                return O.some(rule);
            case "Include":
                return O.none;
        }
    };
    Internal.collectInclude = (rule) => {
        switch (rule._type) {
            case "Attach":
                return O.none;
            case "SplitByPercent":
                return O.none;
            case "SplitByValue":
                return O.none;
            case "Include":
                return O.some(rule);
        }
    };
})(Internal = exports.Internal || (exports.Internal = {}));
var Json;
(function (Json) {
    let Clause;
    (function (Clause) {
        Clause.StringOperator = iot.union([
            iot.literal("Eq"),
            iot.literal("Neq")
        ]);
        Clause.NumberOperator = iot.union([
            iot.literal("Eq"),
            iot.literal("Neq"),
            iot.literal("Gt"),
            iot.literal("Lt"),
            iot.literal("Gte"),
            iot.literal("Lte")
        ]);
        Clause.Operator = iot.union([
            Clause.StringOperator,
            Clause.NumberOperator
        ]);
        Clause.And = iot.recursion("t", () => iot.type({
            _type: iot.literal("And"),
            left: Clause.t,
            right: Clause.t
        }));
        Clause.Not = iot.recursion("t", () => iot.type({
            _type: iot.literal("Not"),
            clause: Clause.t
        }));
        Clause.StringMatch = iot.type({
            _type: iot.literal("StringMatch"),
            field: Transaction.Json.Field.StringField,
            operator: Clause.StringOperator,
            value: iot.string
        });
        Clause.NumberMatch = iot.type({
            _type: iot.literal("NumberMatch"),
            field: Transaction.Json.Field.NumberField,
            operator: Clause.NumberOperator,
            value: iot.number
        });
        Clause.Exists = iot.type({
            _type: iot.literal("Exists"),
            field: Transaction.Json.Field.OptionNumberField
        });
        Clause.StringGlob = iot.type({
            _type: iot.literal("StringGlob"),
            field: Transaction.Json.Field.StringField,
            value: iot.string
        });
        Clause.t = iot.recursion("t", () => iot.union([Clause.And, Clause.Not, Clause.StringMatch, Clause.NumberMatch, Clause.Exists, Clause.StringGlob]));
    })(Clause = Json.Clause || (Json.Clause = {}));
    let Attach;
    (function (Attach) {
        Attach.t = iot.type({
            _type: iot.literal("Attach"),
            where: Clause.t,
            field: iot.string,
            value: iot.string
        });
    })(Attach = Json.Attach || (Json.Attach = {}));
    let Split;
    (function (Split) {
        Split.Percent = iot.type({
            _type: iot.literal("Percent"),
            account: iot.string,
            percent: iot.number
        });
        Split.Value = iot.type({
            _type: iot.literal("Value"),
            account: iot.string,
            value: iot.number
        });
        Split.SplitByPercent = iot.type({
            _type: iot.literal("SplitByPercent"),
            where: Clause.t,
            splits: iot.array(Split.Percent)
        });
        Split.SplitByValue = iot.type({
            _type: iot.literal("SplitByValue"),
            where: Clause.t,
            splits: iot.array(Split.Value),
            remainder: iot.string
        });
        Split.t = iot.union([Split.SplitByPercent, Split.SplitByValue]);
    })(Split = Json.Split || (Json.Split = {}));
    let Include;
    (function (Include) {
        Include.t = iot.type({
            _type: iot.literal("Include"),
            where: Clause.t
        });
    })(Include = Json.Include || (Json.Include = {}));
    Json.Rule = iot.union([Attach.t, Split.t, Include.t]);
    Json.Request = iot.type({
        accountId: iot.string,
        rule: Json.Rule
    });
    Json.from = (rule) => {
        return (0, pipeable_1.pipe)(rule, Json.Request.decode, E.map(rule => { return Object.assign(Object.assign({}, rule), { id: O.none }); }), E.mapLeft((_) => magic_1.Exception.throwMalformedJson));
    };
    Json.to = (rule) => {
        const id = (0, pipeable_1.pipe)(rule.id, O.map(id => { return { id: id }; }), O.getOrElse(() => { return {}; }));
        return Object.assign(Object.assign({}, id), { accountId: rule.accountId, rule: rule.rule });
    };
})(Json = exports.Json || (exports.Json = {}));
var Database;
(function (Database) {
    Database.t = iot.type({
        id: iot.string,
        account_id: iot.string,
        rule: Json.Rule
    });
    Database.from = (rule) => {
        return (0, pipeable_1.pipe)(rule, Database.t.decode, E.map(camelcase_keys_1.default), E.map(rule => { return Object.assign(Object.assign({}, rule), { id: O.some(rule.id) }); }), E.mapLeft(E.toError));
    };
})(Database = exports.Database || (exports.Database = {}));
//# sourceMappingURL=rule.js.map