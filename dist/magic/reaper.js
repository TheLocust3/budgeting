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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueue = void 0;
const crypto_1 = __importDefault(require("crypto"));
const T = __importStar(require("fp-ts/Task"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const withTimeout_1 = require("fp-ts-contrib/Task/withTimeout");
let queue = [];
/*
Example:

  Reaper.enqueue((id) => {
    return async () => {
      console.log(`TESTEST ${id}`);
      return true;
    };
  });
*/
const enqueue = (job, retriesRemaining = 5) => {
    queue.push({ job: job, retriesRemaining: retriesRemaining });
};
exports.enqueue = enqueue;
const reaper = async () => {
    const start = new Date();
    const element = queue.shift();
    if (element !== undefined) {
        const id = crypto_1.default.randomUUID();
        const { job, retriesRemaining } = element;
        await (0, pipeable_1.pipe)((0, withTimeout_1.withTimeout)(false, 5000)(job(id)), T.map((succeeded) => {
            if (!succeeded) {
                if (retriesRemaining > 0) {
                    console.log(`Reaper - job ${id} failed, retrying - ${retriesRemaining}`);
                    setTimeout(() => (0, exports.enqueue)(job, retriesRemaining - 1), 500);
                }
                else {
                    console.log(`Reaper - job ${id} failed, exceeded max retries`);
                }
            }
        }))();
    }
    const end = new Date();
    const remaining = Math.max(100 - (end.getTime() - start.getTime()), 0);
    setTimeout(reaper, remaining); // process a job at most every 100ms
};
reaper();
//# sourceMappingURL=reaper.js.map