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
exports.Channel = exports.Frontend = exports.Internal = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const iot = __importStar(require("io-ts"));
const Transaction = __importStar(require("./transaction"));
const magic_1 = require("../magic");
var Internal;
(function (Internal) {
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
            field: Transaction.Internal.Field.StringField,
            operator: Clause.StringOperator,
            value: iot.string
        });
        Clause.NumberMatch = iot.type({
            _type: iot.literal("NumberMatch"),
            field: Transaction.Internal.Field.NumberField,
            operator: Clause.NumberOperator,
            value: iot.number
        });
        Clause.Exists = iot.type({
            _type: iot.literal("Exists"),
            field: Transaction.Internal.Field.OptionNumberField
        });
        Clause.StringGlob = iot.type({
            _type: iot.literal("StringGlob"),
            field: Transaction.Internal.Field.StringField,
            value: iot.string
        });
        Clause.t = iot.recursion("t", () => iot.union([Clause.And, Clause.Not, Clause.StringMatch, Clause.NumberMatch, Clause.Exists, Clause.StringGlob]));
    })(Clause = Internal.Clause || (Internal.Clause = {}));
    let Attach;
    (function (Attach) {
        Attach.t = iot.type({
            _type: iot.literal("Attach"),
            where: Clause.t,
            field: iot.string,
            value: iot.string
        });
    })(Attach = Internal.Attach || (Internal.Attach = {}));
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
    })(Split = Internal.Split || (Internal.Split = {}));
    let Include;
    (function (Include) {
        Include.t = iot.type({
            _type: iot.literal("Include"),
            where: Clause.t
        });
    })(Include = Internal.Include || (Internal.Include = {}));
    Internal.Rule = iot.union([Attach.t, Split.t, Include.t]);
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
    Internal.t = iot.type({
        id: iot.string,
        accountId: iot.string,
        userId: iot.string,
        rule: Internal.Rule
    });
    Internal.Json = new magic_1.Format.JsonFormatter(Internal.t);
    Internal.Database = new class {
        constructor() {
            this.TableType = iot.type({
                id: iot.string,
                account_id: iot.string,
                user_id: iot.string,
                rule: Internal.Rule
            });
            this.from = (obj) => {
                return (0, pipeable_1.pipe)(obj, this.TableType.decode, E.mapLeft((_) => magic_1.Exception.throwInternalError), E.map(({ id, account_id, user_id, rule }) => { return { id: id, accountId: account_id, userId: user_id, rule: rule }; }));
            };
            this.to = (obj) => {
                return {
                    id: obj.id,
                    account_id: obj.accountId,
                    user_id: obj.userId,
                    rule: obj.rule
                };
            };
        }
    };
})(Internal = exports.Internal || (exports.Internal = {}));
var Frontend;
(function (Frontend) {
    let Create;
    (function (Create) {
        const t = iot.type({
            accountId: iot.string,
            userId: iot.string,
            rule: Internal.Rule
        });
        Create.Json = new magic_1.Format.JsonFormatter(t);
    })(Create = Frontend.Create || (Frontend.Create = {}));
})(Frontend = exports.Frontend || (exports.Frontend = {}));
var Channel;
(function (Channel) {
    let Query;
    (function (Query) {
        const t = iot.type({
            accountId: iot.string,
            userId: iot.string
        });
        Query.Json = new magic_1.Format.JsonFormatter(t);
    })(Query = Channel.Query || (Channel.Query = {}));
    let Response;
    (function (Response) {
        let RuleList;
        (function (RuleList) {
            const t = iot.type({
                rules: iot.array(Internal.t)
            });
            RuleList.Json = new magic_1.Format.JsonFormatter(t);
        })(RuleList = Response.RuleList || (Response.RuleList = {}));
    })(Response = Channel.Response || (Channel.Response = {}));
})(Channel = exports.Channel || (exports.Channel = {}));
//# sourceMappingURL=rule.js.map