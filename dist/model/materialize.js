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
exports.Internal = void 0;
const iot = __importStar(require("io-ts"));
const Rule = __importStar(require("./rule"));
const Transaction = __importStar(require("./transaction"));
const magic_1 = require("../magic");
var Internal;
(function (Internal) {
    Internal.Conflict = iot.type({
        element: Transaction.Internal.t,
        rules: iot.array(Rule.Internal.Rule)
    });
    Internal.t = iot.type({
        conflicts: iot.array(Internal.Conflict),
        tagged: iot.record(iot.string, iot.array(Transaction.Internal.t)),
        untagged: iot.array(Transaction.Internal.t)
    });
    Internal.Json = new magic_1.Format.JsonFormatter(Internal.t);
})(Internal = exports.Internal || (exports.Internal = {}));
//# sourceMappingURL=materialize.js.map