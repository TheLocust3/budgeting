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
exports.execute = exports.Json = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const transaction_frontend_1 = __importDefault(require("../frontend/transaction-frontend"));
const account_frontend_1 = __importDefault(require("../frontend/account-frontend"));
const Transaction = __importStar(require("../model/transaction"));
const Plan = __importStar(require("./plan"));
const Materializer = __importStar(require("./materializer"));
var Json;
(function (Json) {
    let Conflict;
    (function (Conflict) {
        Conflict.to = (conflict) => {
            return {
                element: (0, pipeable_1.pipe)(conflict.element, Transaction.Materialize.to, Transaction.Json.to),
                rules: conflict.rules
            };
        };
    })(Conflict || (Conflict = {}));
    let Tagged;
    (function (Tagged) {
        Tagged.to = (tagged) => (tag) => {
            return { [tag]: (0, pipeable_1.pipe)(tagged[tag], A.map(Transaction.Materialize.to), A.map(Transaction.Json.to)) };
        };
    })(Tagged || (Tagged = {}));
    Json.to = (materialized) => {
        const tagged = A.reduce({}, (tagged, [tag, transactions]) => {
            return Object.assign(Object.assign({}, tagged), { [tag]: (0, pipeable_1.pipe)(transactions, A.map(Transaction.Materialize.to), A.map(Transaction.Json.to)) });
        })(Array.from(materialized.tagged.entries()));
        return {
            conflicts: A.map(Conflict.to)(materialized.conflicts),
            tagged: tagged,
            untagged: (0, pipeable_1.pipe)(materialized.untagged, A.map(Transaction.Materialize.to), A.map(Transaction.Json.to))
        };
    };
})(Json = exports.Json || (exports.Json = {}));
const linkedAccounts = (pool) => (account) => {
    return O.match(() => TE.of([]), (parentId) => (0, pipeable_1.pipe)(TE.Do, TE.bind('parent', () => (0, pipeable_1.pipe)(parentId, account_frontend_1.default.getById(pool), TE.chain(account_frontend_1.default.withRules(pool)), TE.chain(account_frontend_1.default.withChildren(pool)))), TE.bind('rest', ({ parent }) => linkedAccounts(pool)(parent)), TE.map(({ parent, rest }) => rest.concat(parent))))(account.parentId);
};
const executeStage = (stage) => (materialized) => {
    const flow = Materializer.build(stage);
    const maybeElements = materialized.tagged.get(stage.tag);
    const elements = maybeElements ? maybeElements : [];
    return (0, pipeable_1.pipe)(elements, A.map(flow), A.reduce({ conflicts: [], tagged: new Map(), untagged: [] }, ({ conflicts, tagged, untagged }, element) => {
        switch (element._type) {
            case "Conflict":
                return { conflicts: conflicts.concat(element), tagged: tagged, untagged: untagged };
            case "TaggedSet":
                A.map((element) => {
                    const maybeElements = tagged.get(element.tag);
                    if (maybeElements) {
                        tagged.set(element.tag, maybeElements.concat(element.element));
                    }
                    else {
                        tagged.set(element.tag, [element.element]);
                    }
                })(element.elements);
                return { conflicts: conflicts, tagged: tagged, untagged: untagged };
            case "Untagged":
                return { conflicts: conflicts, tagged: tagged, untagged: untagged.concat(element.element) };
        }
    }));
};
const executePlan = (plan) => (transactions) => {
    if (plan.stages.length < 1) {
        return {
            conflicts: [],
            tagged: new Map(),
            untagged: transactions
        };
    }
    else {
        const head = plan.stages[0];
        const tagged = new Map();
        tagged.set(head.tag, transactions);
        return (0, pipeable_1.pipe)(plan.stages, A.map(executeStage), A.reduce({ conflicts: [], tagged: tagged, untagged: [] }, (materialized, stage) => {
            return stage(materialized);
        }));
    }
};
const execute = (pool) => (account) => {
    // TODO: JK track materialize logs with id
    console.log(`materialize - starting for account ${JSON.stringify(account, null, 2)}}`);
    return (0, pipeable_1.pipe)(account, linkedAccounts(pool), TE.chain((accounts) => {
        const plan = Plan.build(accounts.concat(account));
        console.log(`materialize - with plan ${JSON.stringify(plan, null, 2)}`);
        return (0, pipeable_1.pipe)(transaction_frontend_1.default.all(pool)(), TE.map(A.map(Transaction.Materialize.from)), TE.map(executePlan(plan)));
    }));
};
exports.execute = execute;
//# sourceMappingURL=index.js.map