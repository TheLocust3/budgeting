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
exports.execute = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const Plan = __importStar(require("./plan"));
const Materializer = __importStar(require("./materializer"));
const storage_1 = require("../../storage");
const linkedAccounts = (pool) => (account) => {
    return O.match(() => TE.of([]), (parentId) => (0, pipeable_1.pipe)(TE.Do, TE.bind("parent", () => (0, pipeable_1.pipe)(parentId, storage_1.AccountFrontend.getById(pool), TE.chain(storage_1.AccountFrontend.withRules(pool)), TE.chain(storage_1.AccountFrontend.withChildren(pool)))), TE.bind("rest", ({ parent }) => linkedAccounts(pool)(parent)), TE.map(({ parent, rest }) => rest.concat(parent))))(account.parentId);
};
const getSafe = (obj) => (key) => {
    if (key in obj) {
        return obj[key];
    }
    else {
        return undefined;
    }
};
const executeStage = (stage) => (materialized) => {
    const flow = Materializer.build(stage);
    const maybeElements = getSafe(materialized.tagged)(stage.tag);
    const elements = maybeElements ? maybeElements : [];
    return (0, pipeable_1.pipe)(elements, A.map(flow), A.reduce({ conflicts: [], tagged: {}, untagged: [] }, ({ conflicts, tagged, untagged }, element) => {
        switch (element._type) {
            case "Conflict":
                return { conflicts: conflicts.concat(element), tagged: tagged, untagged: untagged };
            case "TaggedSet":
                A.map((element) => {
                    const maybeElements = getSafe(tagged)(element.tag);
                    if (maybeElements) {
                        tagged[element.tag] = maybeElements.concat(element.element);
                    }
                    else {
                        tagged[element.tag] = [element.element];
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
            tagged: {},
            untagged: transactions
        };
    }
    else {
        const head = plan.stages[0];
        const tagged = { [head.tag]: transactions };
        return (0, pipeable_1.pipe)(plan.stages, A.map(executeStage), A.reduce({ conflicts: [], tagged: tagged, untagged: [] }, (materialized, stage) => {
            return stage(materialized);
        }));
    }
};
const execute = (id) => (pool) => (account) => {
    // TODO: JK track materialize logs with id
    console.log(`[${id}] materialize - starting for account ${JSON.stringify(account, null, 2)}}`);
    return (0, pipeable_1.pipe)(account, linkedAccounts(pool), TE.chain((accounts) => {
        const plan = Plan.build(accounts.concat(account));
        console.log(`[${id}] materialize - with plan ${JSON.stringify(plan, null, 2)}`);
        return (0, pipeable_1.pipe)(storage_1.TransactionFrontend.all(pool)(account.userId), TE.map(executePlan(plan)));
    }));
};
exports.execute = execute;
//# sourceMappingURL=index.js.map