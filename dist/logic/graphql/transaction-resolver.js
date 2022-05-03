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
exports.Conflicts = exports.Untagged = exports.Transactions = void 0;
const TE = __importStar(require("fp-ts/TaskEither"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const graphql = __importStar(require("graphql"));
const user_1 = require("../user");
const Types = __importStar(require("./types"));
const magic_1 = require("../../magic");
const materializeFor = (key) => (context) => {
    switch (key) {
        case "physical":
            return user_1.UserArena.materializePhysical(context.arena);
        case "virtual":
            return user_1.UserArena.materializeVirtual(context.arena);
    }
};
const resolveForAccount = (key) => (source, args, context) => {
    return (0, pipeable_1.pipe)(materializeFor(key)(context), TE.map((materialize) => {
        const out = materialize.tagged[source.id];
        if (out) {
            return out;
        }
        else {
            return [];
        }
    }), magic_1.Pipe.toPromise);
};
const resolveForUntagged = (source, args, context) => {
    return (0, pipeable_1.pipe)(materializeFor("virtual")(context), TE.map((materialize) => materialize.untagged), magic_1.Pipe.toPromise);
};
const resolveForConflicts = (source, args, context) => {
    return (0, pipeable_1.pipe)(materializeFor("virtual")(context), TE.map((materialize) => materialize.conflicts), magic_1.Pipe.toPromise);
};
var Transactions;
(function (Transactions) {
    let Physical;
    (function (Physical) {
        Physical.t = {
            type: new graphql.GraphQLList(Types.Transaction.t),
            resolve: resolveForAccount("physical")
        };
    })(Physical = Transactions.Physical || (Transactions.Physical = {}));
    let Virtual;
    (function (Virtual) {
        Virtual.t = {
            type: new graphql.GraphQLList(Types.Transaction.t),
            resolve: resolveForAccount("virtual")
        };
    })(Virtual = Transactions.Virtual || (Transactions.Virtual = {}));
})(Transactions = exports.Transactions || (exports.Transactions = {}));
var Untagged;
(function (Untagged) {
    Untagged.t = {
        type: new graphql.GraphQLList(Types.Transaction.t),
        resolve: resolveForUntagged
    };
})(Untagged = exports.Untagged || (exports.Untagged = {}));
var Conflicts;
(function (Conflicts) {
    Conflicts.t = {
        type: new graphql.GraphQLList(new graphql.GraphQLObjectType({
            name: "Conflict",
            fields: {
                element: { type: new graphql.GraphQLList(Types.Transaction.t) },
                rules: { type: new graphql.GraphQLList(Types.Rule.t) }
            }
        })),
        resolve: resolveForConflicts
    };
})(Conflicts = exports.Conflicts || (exports.Conflicts = {}));
//# sourceMappingURL=transaction-resolver.js.map