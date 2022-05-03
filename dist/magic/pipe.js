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
exports.fromPromise = exports.toPromise = exports.orElse = exports.flattenOption = void 0;
const pipeable_1 = require("fp-ts/lib/pipeable");
const A = __importStar(require("fp-ts/Array"));
const O = __importStar(require("fp-ts/Option"));
const TE = __importStar(require("fp-ts/TaskEither"));
const Exception = __importStar(require("./exception"));
const flattenOption = (arr) => {
    return (0, pipeable_1.pipe)(arr, A.map(O.match(() => [], (x) => [x])), A.flatten);
};
exports.flattenOption = flattenOption;
const orElse = (elseOpt) => (opt) => {
    return O.fold(() => elseOpt(), (value) => O.some(value))(opt);
};
exports.orElse = orElse;
const toPromise = (task) => {
    return TE.match((error) => { throw new Error(error._type); }, (out) => out)(task)();
};
exports.toPromise = toPromise;
const fromPromise = (promise) => {
    return TE.tryCatch(() => promise, (error) => {
        console.log(error);
        return Exception.throwInternalError;
    });
};
exports.fromPromise = fromPromise;
//# sourceMappingURL=pipe.js.map