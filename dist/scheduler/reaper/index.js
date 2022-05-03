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
exports.tick = void 0;
const PullerJob = __importStar(require("./puller-job"));
const RollupJob = __importStar(require("./rollup-job"));
const magic_1 = require("../../magic");
const tick = (pool) => (plaidClient) => {
    magic_1.Reaper.enqueue(PullerJob.run(pool)(plaidClient));
    magic_1.Reaper.enqueue(RollupJob.run(pool)(plaidClient));
    setTimeout(() => (0, exports.tick)(pool)(plaidClient), 1000);
};
exports.tick = tick;
//# sourceMappingURL=index.js.map